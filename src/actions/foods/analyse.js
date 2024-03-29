import getResourceForStageOne from "./getResourceForStageOne";
import getResourceForStageTwo from "./getResourceForStageTwo";
import getResourceForStageThree from "./getResourceForStageThree";
import setInStageThree from "./setInStageThree";
import setLoading from "../ui/setLoading";

import Food from "../../models/food";

export function analyse(picturePath) {
  let stageOne = [];
  let stageTwo = [];
  let stageThree = [];

  Food.reset();

  return dispatch => {
    dispatch(getResourceForStageOne(picturePath))
      .catch(error =>
        console.log("Got the following error while getting stage one", error)
      )
      .then((foodsInPicture, err) => {
        console.log("Foods in picture", foodsInPicture);
        foodsInPicture.forEach(concept => {
          const newFoodAttributes = {
            id: concept.id,
            name: concept.name,
            probability: concept.value,
            portionSize: 1
          };
          const newFood = new Food(newFoodAttributes); // =-> stage I
          stageOne.push(newFood);
        });
        dispatch(setInStageThree(stageOne));
        dispatch(setLoading(false));

        return stageOne.map(food => {
          dispatch(getResourceForStageTwo(food, food.name))
            .catch(error =>
              console.log(
                "Got the following error while getting stage two",
                error
              )
            )
            .then(usdaOptions => {
              food.options = usdaOptions; // =-> stage II

              const ndbno = usdaOptions[0].ndbno;
              usdaOptions[0].selected = true;
              return dispatch(getResourceForStageThree(food, ndbno));
            })
            .then((usdaAnalysis, err) => {
              const analysis = _cleanedAnalysis(usdaAnalysis);
              food.macros = analysis.macros;
              food.micros = analysis.micros;
              food.measure = analysis.measure;
              food.qty = analysis.qty;

              food.save();
              if (Food.all().length === foodsInPicture.length) {
                console.log("all foods", Food.all());
                dispatch(setInStageThree(Food.all()));
                dispatch(setLoading(false));
              }
              return food;
            })
            .catch(error =>
              console.log(
                "Got the following error while getting stage three",
                error
              )
            );
        });
      })
      .catch(err => console.log("Error while at stage zero", err));
  };
}

export function _cleanedAnalysis(analysis) {
  const MACROS = {
    "208": "calorie",
    "203": "protein",
    "204": "fat",
    "205": "carbohydrate"
  };

  let cleanedAnalysis = {
    macros: {},
    micros: {},
    measure: 0,
    qty: 0,
    foodGroup: ""
  };

  for (key in analysis) {
    switch (key) {
      case "desc":
        if (analysis[key].fg) cleanedAnalysis.foodGroup = analysis[key].fg;
        break;
      case "nutrients":
        __getCleanNutrients(analysis[key]);
        break;
      default:
        break;
    }

    function __getCleanNutrients(nutrients) {
      cleanedAnalysis.measure = analysis[key][0].measures[0].label;
      cleanedAnalysis.qty = analysis[key][0].measures[0].qty;
      nutrients.forEach(nutrient => {
        if (MACROS[nutrient.nutrient_id.toString()]) {
          cleanedAnalysis.macros[MACROS[nutrient.nutrient_id.toString()]] = {
            value: parseInt(nutrient.measures[0].value)
          };
        } else {
          cleanedAnalysis.micros[nutrient.name] = {
            value: parseInt(nutrient.measures[0].value),
            unit: nutrient.measures[0].eunit
          };
        }
      });
    }
  }
  return cleanedAnalysis;
}
