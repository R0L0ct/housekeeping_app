import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { TextInput } from "react-native-gesture-handler";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  SQLiteProvider,
  useSQLiteContext,
  type SQLiteDatabase,
} from "expo-sqlite";

interface Room {
  id: string;
  name: string;
}

interface Roomdos {
  id?: number;
  room?: string;
  is_out?: boolean;
  is_ready?: boolean;
}

const Checklist = () => {
  const db = useSQLiteContext();
  const [roomData, setRoomData] = useState<Roomdos[]>([]);

  useEffect(() => {
    async function fetchData() {
      const result = await db.getAllAsync<Roomdos>(
        "SELECT * FROM housekeeping"
      );
      if (result) {
        setRoomData(result);
        console.log(result);
      } else {
        setRoomData([]);
      }
    }
    fetchData();
  }, []);

  const data: Room[] = [
    { id: "1", name: "101" },
    { id: "2", name: "102" },
    { id: "3", name: "103" },
    { id: "4", name: "104" },
    { id: "5", name: "105" },
    { id: "6", name: "106" },
    { id: "7", name: "107" },
    { id: "8", name: "108" },
    { id: "9", name: "109" },
    { id: "10", name: "113" },
    { id: "11", name: "123" },
    { id: "12", name: "133" },
    { id: "13", name: "143" },
  ];

  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>(
    {}
  );

  const [searchText, setSearchText] = useState("");

  const [filteredData, setFilteredData] = useState(data);

  const handleCheck = (id: string) => {
    setCheckedItems((prevState: any) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    const filtered = data.filter((item) =>
      item.name.toLowerCase().trim().includes(text.toLowerCase().trim())
    );
    setFilteredData(filtered);
  };

  const renderItem = ({ item }: { item: Room }) => {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => handleCheck(item.id)}
          style={styles.touchable}
        >
          <Text style={styles.text}>{checkedItems[item.id] ? "✔️" : "❌"}</Text>
          <Text style={styles.text}>{item.name}</Text>
        </TouchableOpacity>
      </View>
    );
  };
  return (
    <View style={styles.mainContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar habitacion..."
          value={searchText}
          onChangeText={handleSearch}
        />
        <FontAwesome
          name="search"
          size={24}
          color="gray"
          style={{ backgroundColor: "#fafafa", paddingRight: 10 }}
        />
      </View>
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={{ paddingTop: 30 }}
      />
      <Pressable
        style={{ borderColor: "white" }}
        onPress={() => alert("added")}
      >
        <Text style={{ color: "white" }}>ADD</Text>
      </Pressable>
    </View>
  );
};

export default Checklist;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: Dimensions.get("window").height - 80,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  touchable: {
    flexDirection: "row",
    gap: 10,
  },
  searchInput: {
    height: 30,
    paddingHorizontal: 10,
    backgroundColor: "#fafafa",
    width: "100%",
  },
  searchContainer: {
    width: "100%",
    flexDirection: "row",
  },
});
