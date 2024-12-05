import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { TextInput } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect } from "@react-navigation/native";

interface Room {
  id: number;
  room: string;
  is_out: number;
  is_ready: number;
}

const Checklist = () => {
  const db = useSQLiteContext();
  const [roomData, setRoomData] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState<Room[]>([]);
  const [refresh, setRefresh] = useState(false);

  // useEffect(() => {
  // const fetchdata = async () => {
  //   await db.execAsync("DELETE FROM housekeeping");
  // };
  // fetchdata();

  // Genera los números de habitaciones
  // const fetchdata = async () => {
  //   const hotelRooms: string[] = [];
  //   for (let floor = 2; floor <= 12; floor++) {
  //     for (let room = 1; room <= 10; room++) {
  //       hotelRooms.push(`${floor}${room.toString().padStart(2, "0")}`);
  //     }
  //   }

  //   await db.withExclusiveTransactionAsync(async (txn) => {
  //     hotelRooms.forEach(async (roomNumber) => {
  //       await txn.execAsync(
  //         `INSERT INTO housekeeping (room, is_out, is_ready) VALUES ('${roomNumber}', False, False)`
  //       );
  //     });
  //   });
  // };

  // fetchdata();
  // }, []);

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        try {
          const result = await db.getAllAsync<Room>(
            "SELECT * FROM housekeeping"
          );
          if (result.length) {
            setRoomData(result);
            setFilteredData(result);
            setLoading(false);

            const initialCheckedItems = result.reduce((acc: any, room: any) => {
              acc[room.id] = room.is_out === 1; // Si is_out es 1, marca el checkbox como verdadero
              return acc;
            }, {});

            setCheckedItems(initialCheckedItems);
          } else {
            setRoomData([]);
            setFilteredData([]);
            setLoading(false);
          }
        } catch (err) {
          console.log("Error fetching data from housekeeping", err);
          setRoomData([]);
          setFilteredData([]);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
      return () => {
        setLoading(true);
      };

      // if (refresh) {
      //   fetchData();
      //   setRefresh(false);
      // }
    }, [])
  );
  // const handleRefresh = () => {
  //   setRefresh(true);
  // };
  // const handleAdd = async () => {
  //   try {
  //     const selectedIds = Object.keys(checkedItems)
  //       .filter((key) => checkedItems[key])
  //       .map((id) => parseInt(id));

  //     if (selectedIds.length === 0) {
  //       alert("No hay habitaciones seleccionadas");
  //       return;
  //     }

  //     const query = `UPDATE housekeeping SET is_out = True WHERE id IN (${selectedIds.join(
  //       ", "
  //     )})`;

  //     await db.withExclusiveTransactionAsync(async (txn) => {
  //       await txn.execAsync(query);
  //       console.log("Transaccion completada");
  //     });

  //     const verifyQuery = `SELECT * FROM housekeeping WHERE id IN (${selectedIds.join(
  //       ", "
  //     )})`;
  //     const result = await db.getAllAsync(verifyQuery);
  //     console.log("Datos verificados después de la transacción:", result);

  //     const updateData = roomData.map((room) =>
  //       selectedIds.includes(room.id) ? { ...room, is_out: 1 } : room
  //     );
  //     setRoomData(updateData);

  //     alert("Habitaciones actualizadas correctamente.");
  //   } catch (error) {
  //     console.log("Error actualizando habitaciones", error);
  //     alert("Hubo un error actualizando las habitaciones.");
  //   }
  // };

  const updateItemsInDb = async (id: number, status: boolean) => {
    try {
      if (status) {
        const query = `UPDATE housekeeping SET is_out = True WHERE id = ${id}`;
        const sentquery = `UPDATE data_sending SET is_sent = False WHERE id = 1`;
        setLoading(true);
        await db.withExclusiveTransactionAsync(async (txn) => {
          await txn.execAsync(query);
          await txn.execAsync(sentquery);
        });
        setLoading(false);
      } else {
        const query = `UPDATE housekeeping SET is_out = False WHERE id = ${id}`;
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

  const handleSearch = (text: string) => {
    if (/^\d*$/.test(text)) {
      setSearchText(text);
      const filtered = roomData.filter((item) =>
        item.room.trim().includes(text.trim())
      );
      setFilteredData(filtered);
    }
  };

  // const renderItem = ({ item }: { item: Room }) => {
  //   return (
  //     <View style={styles.container}>
  //       <TouchableOpacity
  //         onPress={() => handleCheck(item.id)}
  //         style={styles.touchable}
  //       >
  //         <View style={styles.roomContainer}>
  //           <Text style={styles.text}>
  //             {checkedItems[item.id] ? "✔️" : "❌"}
  //           </Text>
  //           <Text style={styles.text}>{item.room}</Text>
  //         </View>
  //       </TouchableOpacity>
  //     </View>
  //   );
  // };

  const renderItem = useCallback(
    ({ item }: { item: Room }) => (
      <RoomItem
        item={item}
        isChecked={checkedItems[item.id]}
        onCheck={handleCheck}
      />
    ),
    [checkedItems, handleCheck]
  );

  const RoomItem = React.memo(
    ({
      item,
      isChecked,
      onCheck,
    }: {
      item: Room;
      isChecked: boolean;
      onCheck: (id: number) => void;
    }) => {
      return (
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => onCheck(item.id)}
            style={styles.touchable}
          >
            <View style={styles.roomContainer}>
              <Text style={styles.text}>{isChecked ? "✔️" : "❌"}</Text>
              <Text style={styles.text}>{item.room}</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }
  );
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#fafafa" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar habitacion..."
          value={searchText}
          onChangeText={handleSearch}
          keyboardType="numeric"
        />
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            width: 40,
            height: 40,
            backgroundColor: "#fafafa",
          }}
        >
          <FontAwesome name="search" size={24} color="gray" />
        </View>
      </View>
      {/* <TouchableOpacity onPress={handleRefresh}>
        <FontAwesome name="refresh" size={24} color="red" />
      </TouchableOpacity> */}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={true}
        contentContainerStyle={styles.listContentContainer}
        style={styles.list}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
      />
      {/* <Pressable style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>ENVIAR</Text>
      </Pressable> */}
    </View>
  );
};

export default Checklist;

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
    fontSize: 30,
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
  roomContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 15,
  },
});
