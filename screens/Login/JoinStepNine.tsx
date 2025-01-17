import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useQuery, useMutation } from "react-query";
import { Category, UserApi, CategoryResponse } from "../../api";
import { useToast } from "react-native-toast-notifications";
import { useDispatch, useSelector } from "react-redux";
import CustomText from "../../components/CustomText";
import CustomTextInput from "../../components/CustomTextInput";
import styled from "styled-components/native";

const Container = styled.View`
  width: 100%;
  height: 95%;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  padding-horizontal: 20px;
  padding-top: 30px;
`;

const Wrap = styled.View`
  width: 100%;
`;

const BorderWrap = styled.View`
  width: 100%;
  height: 2px;
  background-color: #d0d0d0;
`;

const Border = styled.View`
  width: 90%;
  height: 2px;
  background-color: #295af5;
`;

const AskText = styled.Text`
  color: #000000;
  font-size: 20px;
  font-weight: bold;
  margin-top: 24px;
`;

const SubText = styled.Text`
  color: #a0a0a0;
  font-size: 12px;
  margin-top: 7px;
`;

const Button = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 48px;
  background-color: ${(props) => (props.disabled ? "#d3d3d3" : "#295AF5")};
`;

const ButtonTitle = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: 700;
`;

const CategoryWrap = styled.View`
  margin-top: 20px;
`;

const CategoryText = styled(CustomText)<{ selected?: boolean }>`
  font-size: 14px;
  line-height: 21px;
  text-align: center;
  color: ${(props) => (props.selected ? "white" : "black")};
`;

const CategoryView = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  margin: 10px 0px;
`;
const CategoryLabel = styled.TouchableOpacity<{ selected?: boolean }>`
  justify-content: center;
  align-items: center;
  padding: 3px 5px;
  border-radius: 20px;
  border: 1px solid #d7d7d7;
  background-color: ${(props) => (props.selected ? "#295AF5" : "white")};
  margin: 0px 5px;
`;

const JoinStepNine: React.FC<NativeStackScreenProps<any, "AuthStack">> = ({ navigation: { navigate } }) => {
  const token = useSelector((state) => state.AuthReducers.authToken);
  const toast = useToast();

  const { isLoading: categoiresLoading, data: categories } = useQuery<CategoryResponse>(["getCategories", token], UserApi.getCategories, {
    onSuccess: (res) => {
      const count = 4;
      const bundle = [];
      for (let i = 0; i < res.data.length; i += count) bundle.push(res.data.slice(i, i + count));
      setCategoryBundle(bundle);
    },
  });

  // console.log(categories?.data.length);

  const [selectCategory1, setCategory1] = useState(categories[0]?.id ?? -1);
  const [selectCategory2, setCategory2] = useState(categories[1]?.id ?? -1);
  const [categoryBundle, setCategoryBundle] = useState<Array<Category[]>>();

  const onPressCategory = (id: number) => {
    if (selectCategory1 === id) {
      return setCategory1(-1);
    } else if (selectCategory2 === id) {
      return setCategory2(-1);
    }
    if (selectCategory1 === -1) {
      return setCategory1(id);
    } else if (selectCategory2 === -1) {
      return setCategory2(id);
    } else {
      toast.show("카테고리는 2개만 고를 수 있습니다.", {
        type: "warning",
      });
    }
  };

  const goToNext = () => {
    navigate("LoginStack", {
      screen: "JoinStepSuccess",
    });
  };

  return (
    <Container>
      <Wrap>
        <BorderWrap>
          <Border></Border>
        </BorderWrap>
        <AskText>관심있는 카테고리를 3개 이상 선택해주세요.</AskText>
        <SubText>모임 추천에 반영됩니다.</SubText>
        {categoiresLoading ? (
          <></>
        ) : (
          <CategoryWrap>
            {categoryBundle?.map((bundle, index) => (
              <CategoryView key={index}>
                {bundle?.map((categories, index) => (
                  <CategoryLabel key={index} onPress={() => onPressCategory(categories.id)} selected={selectCategory1 === categories.id || selectCategory2 === categories.id}>
                    <CategoryText selected={selectCategory1 === categories.id || selectCategory2 === categories.id}>{`${categories.thumbnail} ${categories.name}`}</CategoryText>
                  </CategoryLabel>
                ))}
              </CategoryView>
            ))}
          </CategoryWrap>
        )}
      </Wrap>
      <Wrap>
        <Button onPress={goToNext}>
          <ButtonTitle>다음</ButtonTitle>
        </Button>
      </Wrap>
    </Container>
  );
};

export default JoinStepNine;
