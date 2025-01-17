import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { ActivityIndicator, FlatList, Platform, StatusBar, Text, TouchableOpacity, View } from "react-native";
import styled from "styled-components/native";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import ClubList from "../components/ClubList";
import { useInfiniteQuery, useQuery, useQueryClient } from "react-query";
import { Category, CategoryResponse, ClubApi, Club, ClubsResponse, ClubsParams } from "../api";
import { ClubListScreenProps } from "../Types/Club";
import { useSelector } from "react-redux";
import CustomText from "../components/CustomText";
import { Modalize, useModalize } from "react-native-modalize";
import { Portal } from "react-native-portalize";
import { Slider } from "@miblanchard/react-native-slider";

const Loader = styled.SafeAreaView`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding-top: ${Platform.OS === "android" ? StatusBar.currentHeight : 0}px;
`;

const CategoryButton = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
`;
const CategoryName = styled(CustomText)`
  font-size: 15px;
  color: gray;
  line-height: 21px;
`;

const SelectedCategoryName = styled(CustomText)`
  font-family: "NotoSansKR-Bold";
  font-size: 15px;
  color: black;
  line-height: 21px;
`;

const Container = styled.SafeAreaView`
  flex: 1;
`;

const HeaderView = styled.View`
  height: 80px;
`;

const HeaderSection = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border-top-width: 1px;
  border-top-color: #e9e9e9;
  border-bottom-width: 1px;
  border-bottom-color: #e9e9e9;
`;

const HeaderItem = styled.View`
  flex: 1;
  padding: 0px 20px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const HeaderItemText = styled(CustomText)`
  font-size: 11px;
  line-height: 15px;
`;

const MainView = styled.View`
  flex: 1;
`;

const FloatingButton = styled.TouchableOpacity`
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 45px;
  height: 45px;
  background-color: #295af5;
  elevation: 5;
  box-shadow: 1px 1px 3px gray;
  border-radius: 50px;
  justify-content: center;
  align-items: center;
  border: 1px;
  border-color: white;
`;

const ModalContainer = styled.View`
  flex: 1;
  padding: 30px 20px 20px 20px;
`;

const ItemView = styled.View`
  flex-direction: row;
  margin: 8px 0px;
  align-items: center;
`;

const ItemLeftView = styled.View`
  flex: 1;
`;
const ItemRightView = styled.View`
  flex: 4;
`;
const ItemNameText = styled(CustomText)`
  font-family: "NotoSansKR-Medium";
  font-size: 15px;
  line-height: 21px;
`;
const ItemContentView = styled.View``;
const ItemContentText = styled(CustomText)`
  font-size: 13px;
`;
const ItemContentSubText = styled(CustomText)``;
const ItemContentButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

const CheckBox = styled.View`
  height: 75%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  margin-left: 5px;
  background-color: white;
`;

const SubmitButton = styled.TouchableOpacity`
  height: 50px;
  justify-content: center;
  align-items: center;
  background-color: #ff714b;
`;
const SubmitText = styled(CustomText)`
  font-size: 20px;
  line-height: 26px;
  font-family: "NotoSansKR-Medium";
  color: white;
`;

const SortingItemView = styled.View`
  justify-content: center;
  align-items: center;
`;
const SortingItemButton = styled.TouchableOpacity`
  padding: 7px 0px;
  margin: 3px 0px;
`;
const SortingItemText = styled(CustomText)<{ selected: boolean }>`
  font-size: 13px;
  color: ${(props) => (props.selected ? "#FF714B" : "#b0b0b0")};
  font-family: ${(props) => (props.selected ? "NotoSansKR-Medium" : "NotoSansKR-Regular")};
`;

interface ClubSortItem {
  title: string;
  sortType: string;
  orderBy: string;
}

const Clubs: React.FC<ClubListScreenProps> = ({ navigation: { navigate } }) => {
  const token = useSelector((state) => state.AuthReducers.authToken);
  const queryClient = useQueryClient();
  const [params, setParams] = useState<ClubsParams>({
    token,
    categoryId: 0,
    clubState: null,
    minMember: null,
    maxMember: null,
    sortType: "created",
    orderBy: "desc",
    showRecruiting: 0,
    showMy: 0,
  });
  const [memberRange, setMemberRange] = useState<number | number[]>([1, 20]);
  let sliderTimeoutId: NodeJS.Timeout;
  const [showRecruiting, setShowRecruiting] = useState<number>(0);
  const [showMy, setShowMy] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [categoryData, setCategoryData] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [isPageTransition, setIsPageTransition] = useState<boolean>(false);
  const { ref: filteringSheetRef, open: openFilteringSheet, close: closeFilteringSheet } = useModalize();
  const { ref: sortingSheetRef, open: openSortingSheet, close: closeSortingSheet } = useModalize();
  const [sortItem, setSortItem] = useState<ClubSortItem[]>();
  const [selectedSortIndex, setSelectedSortIndex] = useState<number>(0);
  const {
    isLoading: clubsLoading,
    data: clubs,
    isRefetching: isRefetchingClubs,
    hasNextPage,
    refetch: clubsRefetch,
    fetchNextPage,
  } = useInfiniteQuery<ClubsResponse>(["clubs", params], ClubApi.getClubs, {
    getNextPageParam: (currentPage) => {
      if (currentPage) {
        return currentPage.hasNext === false ? null : currentPage.responses?.content[currentPage.responses?.content.length - 1].customCursor;
      }
    },
    onSuccess: (res) => {
      setIsPageTransition(false);
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const {
    isLoading: categoryLoading,
    data: category,
    isRefetching: isRefetchingCategory,
  } = useQuery<CategoryResponse>(["getCategories"], ClubApi.getCategories, {
    onSuccess: (res) => {
      setCategoryData([
        {
          description: "All Category",
          id: 0,
          name: "전체",
          thumbnail: null,
          order: null,
        },
        ...res.data,
      ]);
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const goToClub = (clubData: Club) => {
    return navigate("ClubStack", {
      screen: "ClubTopTabs",
      clubData,
    });
  };

  const goToCreation = () => {
    return navigate("ClubCreationStack", {
      screen: "ClubCreationStepOne",
      category,
    });
  };

  const setClubsCategoryParams = (categoryId: number) => {
    let curParams: ClubsParams = params;
    curParams.categoryId = categoryId;
    setParams(curParams);
    setSelectedCategory(categoryId);
    setIsPageTransition(true);
  };

  const setClubsFilterParams = () => {
    let curParams: ClubsParams = params;
    curParams.showRecruiting = showRecruiting;
    curParams.showMy = showMy;
    setParams(curParams);
    setIsPageTransition(true);
  };

  const setClubsSortingParams = (sortIndex: number) => {
    setSelectedSortIndex(sortIndex);
    let curParams: ClubsParams = params;
    if (sortItem !== undefined) {
      curParams.sortType = sortItem[sortIndex].sortType;
      curParams.orderBy = sortItem[sortIndex].orderBy;
      setParams(curParams);
      setIsPageTransition(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries(["clubs"]);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasNextPage) fetchNextPage();
  };

  const loading = categoryLoading && clubsLoading;

  useLayoutEffect(() => {
    console.log("Clubs useLayoutEffect!");
  }, []);

  useEffect(() => {
    console.log("Clubs useEffect!");
    setSortItem([
      {
        title: "최신개설 모임 순",
        sortType: "created",
        orderBy: "desc",
      },
      {
        title: "멤버수 많은 순",
        sortType: "recruitNum",
        orderBy: "desc",
      },
      {
        title: "멤버수 적은 순",
        sortType: "recruitNum",
        orderBy: "asc",
      },
      {
        title: "게시글 많은 순",
        sortType: "feedNum",
        orderBy: "desc",
      },
      {
        title: "하트 많은 순",
        sortType: "likesNum",
        orderBy: "desc",
      },
    ]);
  }, []);

  return loading ? (
    <Loader>
      <ActivityIndicator />
    </Loader>
  ) : (
    <>
      <Container>
        <HeaderView>
          <FlatList
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{}}
            ItemSeparatorComponent={() => <View style={{ marginHorizontal: 10 }} />}
            horizontal
            data={categoryData}
            keyExtractor={(item: Category) => item.id + ""}
            renderItem={({ item, index }: { item: Category; index: number }) => (
              <CategoryButton
                style={{
                  paddingLeft: index === 0 ? 20 : 0,
                  paddingRight: index === Number(category?.data.length) ? 20 : 0,
                }}
                onPress={() => {
                  if (selectedCategory !== item.id) setClubsCategoryParams(item.id);
                }}
              >
                {index === selectedCategory ? <SelectedCategoryName>{item.name}</SelectedCategoryName> : <CategoryName>{item.name}</CategoryName>}
              </CategoryButton>
            )}
          />
          <HeaderSection>
            <HeaderItem>
              <HeaderItemText>상세 필터</HeaderItemText>
              <TouchableOpacity
                style={{
                  height: 35,
                  justifyContent: "center",
                }}
                onPress={() => {
                  openFilteringSheet();
                }}
              >
                <Feather name="filter" size={14} color="black" />
              </TouchableOpacity>
            </HeaderItem>
            <View
              style={{
                borderLeftWidth: 0.5,
                borderRightWidth: 0.5,
                height: "100%",
                borderColor: "#e9e9e9",
              }}
            ></View>
            <HeaderItem>
              <HeaderItemText>최신순</HeaderItemText>
              <TouchableOpacity
                style={{
                  height: 35,
                  justifyContent: "center",
                }}
                onPress={() => {
                  openSortingSheet();
                }}
              >
                <MaterialCommunityIcons name="sort" size={14} color="black" />
              </TouchableOpacity>
            </HeaderItem>
          </HeaderSection>
        </HeaderView>
        <MainView>
          {clubsLoading || isPageTransition ? (
            <Loader>
              <ActivityIndicator />
            </Loader>
          ) : (
            <FlatList
              refreshing={refreshing}
              onRefresh={onRefresh}
              onEndReached={loadMore}
              data={clubs?.pages.map((page) => page?.responses?.content).flat()}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              ItemSeparatorComponent={() => <View style={{ height: 25 }} />}
              ListFooterComponent={() => <View style={{ height: 60 }} />}
              numColumns={2}
              keyExtractor={(item: Club, index: number) => String(index)}
              renderItem={({ item, index }: { item: Club; index: number }) => (
                <TouchableOpacity
                  onPress={() => {
                    goToClub(item);
                  }}
                  style={index % 2 === 0 ? { marginRight: 0.5 } : { marginLeft: 0.5 }}
                >
                  <ClubList
                    thumbnailPath={item.thumbnail}
                    organizationName={item.organizationName}
                    clubName={item.name}
                    memberNum={item.members.length}
                    clubShortDesc={item.clubShortDesc}
                    categories={item.categories}
                    recruitStatus={item.recruitStatus}
                  />
                </TouchableOpacity>
              )}
            />
          )}
        </MainView>
        <FloatingButton onPress={goToCreation}>
          <Feather name="plus" size={30} color="white" />
        </FloatingButton>
      </Container>

      <Portal>
        <Modalize
          ref={filteringSheetRef}
          modalHeight={250}
          handlePosition="inside"
          modalStyle={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
          FooterComponent={
            <SubmitButton
              onPress={() => {
                closeFilteringSheet();
                if (params.showRecruiting !== showRecruiting || params.showMy !== showMy) setClubsFilterParams();
              }}
            >
              <SubmitText>모임 보기</SubmitText>
            </SubmitButton>
          }
        >
          <ModalContainer>
            <ItemView>
              <ItemLeftView>
                <ItemNameText>모집 상태</ItemNameText>
              </ItemLeftView>
              <ItemRightView>
                <ItemContentButton
                  onPress={() => {
                    setShowRecruiting((prev) => (prev === 0 ? 1 : 0));
                  }}
                >
                  <ItemContentText>멤버 모집중인 모임만 보기</ItemContentText>
                  <CheckBox>
                    <Ionicons name="checkmark-sharp" size={10} color={showRecruiting ? "#FF714B" : "white"} />
                  </CheckBox>
                </ItemContentButton>
              </ItemRightView>
            </ItemView>

            <ItemView>
              <ItemLeftView>
                <ItemNameText>멤버 수</ItemNameText>
              </ItemLeftView>
              <ItemRightView>
                <Slider
                  animateTransitions
                  value={memberRange}
                  onValueChange={(value) => {
                    clearTimeout(sliderTimeoutId);
                    sliderTimeoutId = setTimeout(() => {
                      setMemberRange(value);
                    }, 100);
                  }}
                  onSlidingComplete={(value) => setMemberRange(value)}
                  minimumValue={0}
                  minimumTrackTintColor="#FF714B"
                  maximumValue={100}
                  maximumTrackTintColor="#E8E8E8"
                  step={5}
                  thumbTintColor="white"
                  trackStyle={{ height: 2 }}
                  thumbStyle={{ width: 18, height: 18, borderWidth: 1, borderColor: "#FF714B" }}
                />
                <ItemContentSubText>{Array.isArray(memberRange) ? `최소 ${memberRange[0]} 명 이상 최대 ${memberRange[1]} 명 이하` : ``}</ItemContentSubText>
              </ItemRightView>
            </ItemView>

            <ItemView>
              <ItemLeftView>
                <ItemNameText>내 모임</ItemNameText>
              </ItemLeftView>
              <ItemRightView>
                <ItemContentButton
                  onPress={() => {
                    setShowMy((prev) => (prev === 0 ? 1 : 0));
                  }}
                >
                  <ItemContentText>내가 가입된 모임만 보기</ItemContentText>
                  <CheckBox>
                    <Ionicons name="checkmark-sharp" size={10} color={showMy ? "#FF714B" : "#e8e8e8"} />
                  </CheckBox>
                </ItemContentButton>
              </ItemRightView>
            </ItemView>
          </ModalContainer>
        </Modalize>
      </Portal>

      <Portal>
        <Modalize ref={sortingSheetRef} modalHeight={250} handlePosition="inside" modalStyle={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <ModalContainer>
            <SortingItemView>
              {sortItem?.map((item, index) => (
                <SortingItemButton
                  key={index}
                  onPress={() => {
                    if (selectedSortIndex !== index) {
                      closeSortingSheet();
                      setClubsSortingParams(index);
                    }
                  }}
                >
                  <SortingItemText selected={selectedSortIndex === index}>{item.title}</SortingItemText>
                </SortingItemButton>
              ))}
            </SortingItemView>
          </ModalContainer>
        </Modalize>
      </Portal>
    </>
  );
};

export default Clubs;
