import { View, Text, StyleSheet } from "react-native";
import React from "react";
import Checklist from "@/components/Checklist";

const index = () => {
  return <Checklist />;
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
  },
  text: {
    color: "white",
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
  },
});
