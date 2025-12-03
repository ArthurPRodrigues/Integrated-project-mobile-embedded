import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet } from "react-native";

const SERVER_URL = "http://192.168.0.15:8000"; // <--- Precisa alterar o IP

export default function LogsScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch(`${SERVER_URL}/logs`);
        const json = await res.json();

        if (json.logs) {
          setLogs(json.logs);
        }
      } catch (error) {
        console.log("Erro ao buscar logs:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Carregando logs...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={logs}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.line}>⏱ Loop: {item.loop_counter}</Text>
          <Text style={styles.line}>💡 LDR: {item.ldr_value}</Text>
          <Text style={styles.line}>🔌 Status: {item.brightness_status}</Text>
          <Text style={styles.line}>📍 IP: {item.ip_address}</Text>
          <Text style={styles.timestamp}>🕒 {item.timestamp}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#f4f4f4",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  line: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
  },
});
