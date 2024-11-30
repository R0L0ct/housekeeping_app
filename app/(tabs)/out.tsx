import { View, Text, StyleSheet } from "react-native";
import React from "react";

const rooms = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Out</Text>
    </View>
  );
};

export default rooms;

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
