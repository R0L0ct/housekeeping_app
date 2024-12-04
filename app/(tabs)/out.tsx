import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

interface Room {
  id: number;
  room: string;
  is_out: number;
  is_ready: number;
}

type TimerState = {
  [id: number]: number; // Cada habitación tiene un tiempo asociado
};

const rooms = () => {
  const db = useSQLiteContext();
  const [roomData, setRoomData] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState<Room[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [allChecked, setAllChecked] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  const formatDate = (date: Date) => {
    const day = String(date.getDate() - 1).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const convertMinutesToTimeFormat = (totalTime: number) => {
    const hours = Math.floor(totalTime / 60);
    const minutes = totalTime % 60;
    return `${hours}:${String(minutes).padStart(2, "0")}`;
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const result = await db.getAllAsync<Room>(
            "SELECT * FROM housekeeping WHERE is_out = True"
          );
          if (result.length) {
            setRoomData(result);
            setFilteredData(result);
            setLoading(false);

            const initialCheckedItems = result.reduce((acc: any, room: any) => {
              acc[room.id] = room.is_ready === 1;
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
      };
      fetchData();

      return () => {
        setLoading(true);
      };
    }, [])
  );

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (timerRunning) {
      interval = setInterval(() => {
        setTotalTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  useEffect(() => {
    setAllChecked(
      roomData.length > 0 && roomData.every((room) => checkedItems[room.id])
    );
  }, [checkedItems, roomData]);

  const handleTimer = async () => {
    try {
      setTimerRunning(false);
      const currentDate = new Date();
      const formatedDate = formatDate(currentDate);

      const averageTime = roomData.length > 0 ? totalTime / roomData.length : 0;

      const formatedAverage = convertMinutesToTimeFormat(
        Math.floor(averageTime)
      );

      const formatedTime = convertMinutesToTimeFormat(totalTime);

      const query = `INSERT INTO work_stats (work_date, average, total_hours) VALUES ('${formatedDate}', '${formatedAverage}', '${formatedTime}')`;

      alert(`Tiempo total: ${formatedTime}hs\nPromedio: ${formatedAverage}hs`);

      if (totalTime > 0) {
        await db.withExclusiveTransactionAsync(async (txn) => {
          await txn.execAsync(query);
        });
      }

      // const result = await db.getAllAsync("SELECT * FROM work_stats");
      // console.log(result);

      setTotalTime(0);
      setCheckedItems({});
    } catch (error) {
      console.log(error);
    }
  };

  const handleAdd = async () => {
    try {
      const selectedIds = Object.keys(checkedItems)
        .filter((key) => checkedItems[key])
        .map((id) => parseInt(id));

      if (selectedIds.length === 0) {
        alert("No hay habitaciones seleccionadas");
        return;
      }

      // const query = `UPDATE housekeeping SET is_ready = True WHERE id IN (${selectedIds.join(
      //   ", "
      // )})`;

      // await db.withExclusiveTransactionAsync(async (txn) => {
      //   await txn.execAsync(query);
      //   console.log("Transaccion completada");
      // });

      const updateData = roomData.map((room) =>
        selectedIds.includes(room.id) ? { ...room, is_ready: 1 } : room
      );
      setRoomData(updateData);

      // alert("Habitaciones actualizadas correctamente.");

      handleTimer();
      setIsInteractive(false);

      const fetchData = async () => {
        try {
          const result = await db.getAllAsync<Room>(
            "SELECT * FROM housekeeping WHERE is_out = True AND is_ready = False"
          );
          if (result.length) {
            console.log("Datos obtenidos:", result);
            setRoomData(result);
            setFilteredData(result);
            setLoading(false);

            const initialCheckedItems = result.reduce((acc: any, room: any) => {
              acc[room.id] = room.is_ready === 1; // Si is_out es 1, marca el checkbox como verdadero
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
      };

      fetchData();
    } catch (error) {
      console.log("Error actualizando habitaciones", error);
      alert("Hubo un error actualizando las habitaciones.");
    }
  };

  const handleStart = () => {
    setTimerRunning(true);
    setIsInteractive(true);
  };

  const updateItemsInDb = async (id: number, status: boolean) => {
    try {
      if (status) {
        const query = `UPDATE housekeeping SET is_ready = True WHERE id = ${id}`;
        setLoading(true);
        await db.withExclusiveTransactionAsync(async (txn) => {
          await txn.execAsync(query);
        });
        setLoading(false);
      } else {
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
  //aisdf
  const renderItem = ({ item }: { item: Room }) => {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => {
            if (isInteractive) {
              handleCheck(item.id);
            }
          }}
          style={styles.touchable}
          disabled={!isInteractive}
        >
          <Text style={styles.text}>{checkedItems[item.id] ? "✔️" : "❌"}</Text>
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
      {!isInteractive &&
        roomData.length > 0 &&
        !timerRunning &&
        !allChecked && (
          <TouchableOpacity
            onPress={handleStart}
            style={{
              backgroundColor: "blue",
              padding: 10,
              marginTop: 20,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>Iniciar</Text>
          </TouchableOpacity>
        )}
      {allChecked && (
        <TouchableOpacity onPress={handleAdd} style={styles.buttonContainer}>
          <Text style={styles.addButtonText}>Enviar</Text>
        </TouchableOpacity>
      )}
      {/* <Pressable style={styles.addButton} onPress={handleAdd}>

        <Text style={styles.addButtonText}>ENVIAR</Text>


      </Pressable> */}
    </View>
  );
};

export default rooms;

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
  buttonContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
  },
});
