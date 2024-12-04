import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Pressable,
  Alert,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect } from "@react-navigation/native";

interface Room {
  id: number;
  room: string;
  is_out: number;
  is_ready: number;
}

const ready = () => {
  const db = useSQLiteContext();
  const [roomData, setRoomData] = useState<Room[]>([]);
  const [outRoomData, setOutRoomData] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState<Room[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const result = await db.getAllAsync<Room>(
            "SELECT * FROM housekeeping WHERE is_out = True AND is_ready = True"
          );
          const out_result = await db.getAllAsync<Room>(
            "SELECT * FROM housekeeping WHERE is_out = True AND is_ready = False"
          );
          if (result.length) {
            setRoomData(result);
            setFilteredData(result);
            setLoading(false);

            const initialCheckedItems = result.reduce((acc: any, room: any) => {
              acc[room.id] = room.is_ready === 0;
              return acc;
            }, {});

            setCheckedItems(initialCheckedItems);
          } else {
            setRoomData([]);
            setFilteredData([]);
            setLoading(false);
          }

          if (out_result.length) {
            setOutRoomData(out_result);
          }
        } catch (err) {
          console.log("Error fetching data from housekeeping", err);
          setRoomData([]);
          setFilteredData([]);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
      return () => {
        setLoading(true);
      };
    }, [])
  );

  const updateItemsInDb = async (id: number, status: boolean) => {
    try {
      if (status) {
        const query = `UPDATE housekeeping SET is_ready = False WHERE id = ${id}`;
        setLoading(true);
        await db.withExclusiveTransactionAsync(async (txn) => {
          await txn.execAsync(query);
        });
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleCheck = (id: number) => {
    setCheckedItems((prevState: any) => {
      const newCheckedItems = { ...prevState, [id]: !prevState[id] };
      const newStatus = newCheckedItems[id];

      if (prevState[id] !== newStatus) {
        updateItemsInDb(id, newStatus);
      }

      return newCheckedItems;
    });
  };

  const handleFinalize = () => {
    Alert.alert(
      "Confirmar",
      "¿Estás seguro de que deseas finalizar todos los registros?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Aceptar",
          onPress: async () => {
            try {
              const query =
                "UPDATE housekeeping SET is_out = False, is_ready = False";
              await db.withExclusiveTransactionAsync(async (txn) => {
                await txn.execAsync(query);
              });
              console.log("Todos los registros se resetearon");
              alert("Dia finalizado");

              const fetchData = async () => {
                try {
                  const result = await db.getAllAsync<Room>(
                    "SELECT * FROM housekeeping WHERE is_out = True AND is_ready = True"
                  );
                  const out_result = await db.getAllAsync<Room>(
                    "SELECT * FROM housekeeping WHERE is_out = True AND is_ready = False"
                  );
                  if (result.length) {
                    setRoomData(result);
                    setFilteredData(result);
                    setLoading(false);

                    const initialCheckedItems = result.reduce(
                      (acc: any, room: any) => {
                        acc[room.id] = room.is_ready === 0;
                        return acc;
                      },
                      {}
                    );

                    setCheckedItems(initialCheckedItems);
                  } else {
                    setRoomData([]);
                    setFilteredData([]);
                    setLoading(false);
                  }

                  if (out_result.length) {
                    setOutRoomData(out_result);
                  }
                } catch (err) {
                  console.log("Error fetching data from housekeeping", err);
                  setRoomData([]);
                  setFilteredData([]);
                } finally {
                  setLoading(false);
                }
              };

              fetchData();
            } catch (error) {
              console.log(error);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Room }) => {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => handleCheck(item.id)}
          style={styles.touchable}
        >
          <Text style={styles.text}>{checkedItems[item.id] ? "❌" : "✔️"}</Text>
          <Text style={styles.text}>{item.room}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#fafafa" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={true}
        contentContainerStyle={styles.listContentContainer}
        style={styles.list}
      />
      {outRoomData?.length === 0 && roomData?.length > 0 && (
        <Pressable style={styles.addButton} onPress={handleFinalize}>
          <Text style={styles.addButtonText}>FINALIZAR DIA</Text>
        </Pressable>
      )}
    </View>
  );
};
export default ready;

//123
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  touchable: {
    flexDirection: "row",
    gap: 10,
  },
  searchContainer: {
    width: "100%",
    flexDirection: "row",
    paddingTop: 25,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    backgroundColor: "#fafafa",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    color: "white",
  },
  addButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007BFF",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  listContentContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  list: {
    flex: 1,
  },
});
