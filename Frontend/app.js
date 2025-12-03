import * as React from 'react';
import 'react-native-gesture-handler';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  Switch,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Feather } from '@expo/vector-icons';

const SERVER_URL = 'http://192.168.0.15:8000'; // <--- Precisa alterar o IP

import LogsScreen from './LogsScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// HOME SCREEN (Controle do ESP)
function HomeScreen({ navigation }) {
  const [loading, setLoading] = React.useState(false);
  const [timespan, setTimespan] = React.useState(10);
  const [runAgain, setRunAgain] = React.useState(false);
  const [lastResponse, setLastResponse] = React.useState(null);

  React.useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/config/setup`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data && typeof data.timespan !== 'undefined') {
        setTimespan(Number(data.timespan));
      }
      if (data && typeof data.run_again !== 'undefined') {
        setRunAgain(Boolean(data.run_again));
      }

      setLastResponse(null);
    } catch (err) {
      Alert.alert('Erro', `Não foi possível buscar configuração: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function sendSetup() {
    try {
      setLoading(true);
      const payload = {
        timespan: Number(timespan),
        loop_counter: 0,
        run_again: runAgain ? 1 : 0,
      };

      const res = await fetch(`${SERVER_URL}/config/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      setLastResponse(json);
      Alert.alert('Sucesso', 'Configuração enviada com sucesso.');
    } catch (err) {
      Alert.alert('Erro', `Não foi possível enviar configuração: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function inc() {
    setTimespan((t) => Math.min(9999, Number(t) + 1));
  }
  function dec() {
    setTimespan((t) => Math.max(0, Number(t) - 1));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Controle do ESP3200</Text>

        <TouchableOpacity onPress={fetchConfig} style={styles.iconButton}>
          <Feather name="refresh-cw" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Ciclos (timespan)</Text>

        <View style={styles.row}>
          <Pressable style={styles.stepBtn} onPress={dec}>
            <Text style={styles.stepTxt}>–</Text>
          </Pressable>

          <TextInput
            value={String(timespan)}
            onChangeText={(t) => {
              const cleaned = t.replace(/[^0-9]/g, '');
              setTimespan(cleaned === '' ? 0 : Number(cleaned));
            }}
            keyboardType="number-pad"
            style={styles.input}
          />

          <Pressable style={styles.stepBtn} onPress={inc}>
            <Text style={styles.stepTxt}>+</Text>
          </Pressable>
        </View>

        <View style={[styles.row, { marginTop: 12, justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginRight: 8 }}>Re-executar (run_again)</Text>
            <Switch value={runAgain} onValueChange={setRunAgain} />
          </View>

          <Pressable style={styles.saveBtn} onPress={sendSetup}>
            <Text style={styles.saveTxt}>Salvar</Text>
          </Pressable>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 12 }} size="small" />}

        {lastResponse && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 12 }}>
              Resposta: {JSON.stringify(lastResponse)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Importante</Text>
        <Text style={{ fontSize: 13, color: '#444' }}>
          - O app, o ESP e o Backend devem estar na MESMA rede Wi-Fi{'\n'}
          - Sempre use o IP real do computador no SERVER_URL
        </Text>
      </View>
    </SafeAreaView>
  );
}

// NAVEGAÇÃO
function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={({ navigation }) => ({
        headerTitleAlign: 'center',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.getParent()?.toggleDrawer()}
            style={{ paddingHorizontal: 12 }}
          >
            <Feather name="menu" size={22} />
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="Logs" component={LogsScreen} options={{ title: 'Histórico de Leituras' }} />

    </Stack.Navigator>
  );
}

function DrawerContent({ navigation }) {
  const go = (screen) => {
    navigation.navigate('App', { screen });
    navigation.closeDrawer();
  };

  return (
    <View style={{ flex: 1, paddingTop: 40 }}>
      <Pressable onPress={() => go('Home')} style={{ padding: 16 }}>
        <Text style={{ fontSize: 16 }}>🏠 Home</Text>
      </Pressable>

      <Pressable onPress={() => go('Logs')} style={{ padding: 16 }}>
        <Text style={{ fontSize: 16 }}>📜 Histórico</Text>
      </Pressable>
    </View>
  );
}

function Root() {
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }} drawerContent={(p) => <DrawerContent {...p} />}>
      <Drawer.Screen name="App" component={AppStack} />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Root />
    </NavigationContainer>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
    backgroundColor: '#fff',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  iconButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  card: { backgroundColor: '#f8f8f8', padding: 12, borderRadius: 8, marginTop: 12 },
  label: { fontWeight: '600', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#e6e6e6',
    width: 44,
    alignItems: 'center',
  },
  stepTxt: { fontSize: 20, fontWeight: '600' },
  input: {
    marginHorizontal: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 6,
    textAlign: 'center',
    minWidth: 80,
  },
  saveBtn: {
    backgroundColor: '#2e86de',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  saveTxt: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
});
