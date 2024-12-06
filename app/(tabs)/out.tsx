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

interface Timer {
  id: number;
  start_time: number;
}

interface SentData {
  id: number;
  is_sent: number;
}

const rooms = () => {
  const db = useSQLiteContext();
  const [roomData, setRoomData] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState<Room[]>([]);
  const [allChecked, setAllChecked] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isSent, setIsSent] = useState(0);

  const [timerRunning, setTimerRunning] = useState(false);

  const startTimer = async () => {
    try {
      const currentTime = Date.now();
      await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.execAsync(
          `UPDATE timer SET start_time = ${currentTime} WHERE id = 1`
        );
      });
    } catch (error) {
      console.log(error);
    }
  };

  // useEffect(() => {
  // const fetchdata = async () => {
  //   try {
  //     await db.withExclusiveTransactionAsync(async (txn) => {
  //       await txn.execAsync(`CREATE TABLE IF NOT EXISTS data_sending (
  //       id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  //       is_sent BOOLEAN DEFAULT False
  //       ) `);
  //       await txn.execAsync(
  //         `INSERT INTO data_sending (is_sent) VALUES (False)`
  //       );
  //     });
  //     console.log("Datos creados correctamente");
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  // fetchdata();
  // }, []);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const convertSecondsToTimeFormat = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  // const initializeDatabase = async () => {
  //   try {
  //     // await db.execAsync(`
  //     //   CREATE TABLE IF NOT EXISTS timer (
  //     //     id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  //     //     start_time REAL DEFAULT 0
  //     //   )
  //     // `);
  //     await db.execAsync(`
  //       INSERT INTO timer (start_time) VALUES (0)
  //     `);
  //     console.log("Tabla 'timer' creada o ya existe.");
  //   } catch (error) {
  //     console.error("Error al inicializar la base de datos:", error);
  //   }
  // };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const result = await db.getAllAsync<Room>(
            "SELECT * FROM housekeeping WHERE is_out = True"
          );
          const sentData = await db.getAllAsync<SentData>(
            "SELECT * FROM data_sending"
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

          // if (!allChecked && sentData[0]?.is_sent === 0) {
          //   setIsSent(0);
          //   await db.withExclusiveTransactionAsync(async (txn) => {
          //     await txn.execAsync(
          //       "UPDATE data_sending SET is_sent = False WHERE id = 1"
          //     );
          //   });
          // }

          if (sentData.length) {
            setIsSent(sentData[0].is_sent);
          }

          // initializeDatabase();
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
    setAllChecked(
      roomData.length > 0 && roomData.every((room) => checkedItems[room.id])
    );
  }, [checkedItems, roomData]);

  const handleTimer = async () => {
    try {
      setTimerRunning(false);

      const startTime = await db.getAllAsync<Timer>(
        `SELECT * FROM timer WHERE id = 1`
      );

      if (startTime && startTime.length > 0) {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - startTime[0].start_time) / 1000;

        const currentDate = new Date();
        const formatedDate = formatDate(currentDate);

        const averageTime =
          roomData.length > 0 ? elapsedTime / roomData.length : 0;

        const formatedAverage = convertSecondsToTimeFormat(
          Math.floor(averageTime)
        );

        const formatedTime = convertSecondsToTimeFormat(elapsedTime);

        const query = `INSERT INTO work_stats (work_date, average, total_hours) VALUES ('${formatedDate}', '${formatedAverage}', '${formatedTime}')`;

        alert(
          `Tiempo total: ${formatedTime}hs\nPromedio: ${formatedAverage}hs`
        );

        if (elapsedTime > 0) {
          await db.withExclusiveTransactionAsync(async (txn) => {
            await txn.execAsync(query);
          });
        }

        // const result = await db.getAllAsync("SELECT * FROM work_stats");
        // console.log(result);

        // setCheckedItems({});
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAdd = async () => {
    Alert.alert("Confirmar", "¿ Estás seguro de que deseas enviar ?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Aceptar",
        onPress: async () => {
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

            setIsSent(1);
            await db.withExclusiveTransactionAsync(async (txn) => {
              await txn.execAsync(
                "UPDATE data_sending SET is_sent = True WHERE id = 1"
              );
            });
            // const fetchData = async () => {
            //   try {
            //     const result = await db.getAllAsync<Room>(
            //       "SELECT * FROM housekeeping WHERE is_out = True AND is_ready = False"
            //     );
            //     if (result.length) {
            //       console.log("Datos obtenidos:", result);
            //       setRoomData(result);
            //       setFilteredData(result);
            //       setLoading(false);

            //       const initialCheckedItems = result.reduce((acc: any, room: any) => {
            //         acc[room.id] = room.is_ready === 1; // Si is_out es 1, marca el checkbox como verdadero
            //         return acc;
            //       }, {});

            //       setCheckedItems(initialCheckedItems);
            //     } else {
            //       setRoomData([]);
            //       setFilteredData([]);
            //       setLoading(false);
            //     }
            //   } catch (err) {
            //     console.log("Error fetching data from housekeeping", err);
            //     setRoomData([]);
            //     setFilteredData([]);
            //   } finally {
            //     setLoading(false);
            //   }
            // };

            // fetchData();
          } catch (error) {
            console.log("Error actualizando habitaciones", error);
            alert("Hubo un error actualizando las habitaciones.");
          }
        },
      },
    ]);
  };

  const handleStart = () => {
    Alert.alert("Confirmar", "¿ Iniciar dia ?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Aceptar",
        onPress: async () => {
          startTimer();
          setTimerRunning(true);
          setIsInteractive(true);
        },
      },
    ]);
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

  // const renderItem = ({ item }: { item: Room }) => {
  //   return (
  //     <View style={styles.container}>
  //       <TouchableOpacity
  //         onPress={() => {
  //           if (isInteractive) {
  //             handleCheck(item.id);
  //           }
  //         }}
  //         style={styles.touchable}
  //         disabled={!isInteractive}
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
            onPress={() => {
              if (isInteractive) {
                onCheck(item.id);
              }
            }}
            style={styles.touchable}
            disabled={!isInteractive}
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
      {allChecked && isSent === 0 && (
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
  buttonContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
  },
  roomContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 15,
  },
});
