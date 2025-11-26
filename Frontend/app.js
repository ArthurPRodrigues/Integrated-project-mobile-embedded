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

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const SERVER_URL = 'http://10.0.2.2:3000'; // <--- Mudar isso aqui conforme formos colocar o servidor de pé

/* Home Screen */
function HomeScreen({ navigation }) {
  const [loading, setLoading] = React.useState(false);
  const [timespan, setTimespan] = React.useState(10); // número de ciclos (padrão baseado em controle-service.js)
  const [runAgain, setRunAgain] = React.useState(false);
  const [lastResponse, setLastResponse] = React.useState(null);

  React.useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/config`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Espera-se que config tenha timespan, actuator_pin, run_again...
      if (data && typeof data.timespan !== 'undefined') {
        setTimespan(Number(data.timespan));
      } else {
        // fallback: se o endpoint devolver o objeto 'config' em envoltório
        if (data.config && typeof data.config.timespan !== 'undefined') {
          setTimespan(Number(data.config.timespan));
        }
      }
      if (data && typeof data.run_again !== 'undefined') {
        setRunAgain(Boolean(data.run_again));
      }
      setLastResponse(null);
    } catch (err) {
      console.warn('Erro ao buscar config:', err);
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
      const res = await fetch(`${SERVER_URL}/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setLastResponse(json);
      Alert.alert('Sucesso', 'Configuração enviada com sucesso.');
    } catch (err) {
      console.warn('Erro ao enviar setup:', err);
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
              // aceita apenas números
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

        {loading && (
          <View style={{ marginTop: 12 }}>
            <ActivityIndicator size="small" />
          </View>
        )}

        {lastResponse && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 12, color: '#333' }}>Resposta: {JSON.stringify(lastResponse)}</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Notas</Text>
        <Text style={{ fontSize: 13, color: '#444' }}>
          - Ajuste o SERVER_URL no topo do App.js se o backend não estiver no mesmo dispositivo.{'\n'}
          - Emulador Android local: use http://10.0.2.2:3000.{' '}
        </Text>
      </View>
    </SafeAreaView>
  );
}

/* sub telas */
function ProgramacaoJogosScreen() {
  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.title}>Programação dos Jogos</Text>
      <Text>Esta tela é um stub — adicione sua lógica aqui.</Text>
    </SafeAreaView>
  );
}
function ModalidadeDetailsScreen() {
  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.title}>Detalhes da Modalidade</Text>
    </SafeAreaView>
  );
}
function FavoritosScreen() {
  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.title}>Meus Favoritos</Text>
    </SafeAreaView>
  );
}
function AlojamentoListScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.title}>Alojamentos</Text>
      <Text>Lista de alojamentos (stub).</Text>
    </SafeAreaView>
  );
}
function AlojamentoDetailsScreen() {
  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.title}>Detalhes do Alojamento</Text>
    </SafeAreaView>
  );
}

/* Navegação */
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="menu" size={22} />
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="ProgramacaoJogos" component={ProgramacaoJogosScreen} options={{ title: 'Programação dos Jogos' }} />
      <Stack.Screen name="ModalidadeDetails" component={ModalidadeDetailsScreen} options={{ title: 'Detalhes da Modalidade' }} />
      <Stack.Screen name="AlojamentoList" component={AlojamentoListScreen} options={{ title: 'Alojamentos' }} />
      <Stack.Screen name="AlojamentoDetails" component={AlojamentoDetailsScreen} options={{ title: 'Detalhes do Alojamento' }} />
      <Stack.Screen name="Favoritos" component={FavoritosScreen} options={{ title: 'Meus Favoritos' }} />
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
      <Pressable onPress={() => go('Favoritos')} style={{ padding: 16 }}>
        <Text style={{ fontSize: 16 }}>⭐ Meus Favoritos</Text>
      </Pressable>
      <Pressable onPress={() => go('ProgramacaoJogos')} style={{ padding: 16 }}>
        <Text style={{ fontSize: 16 }}>⛹️ Programação dos Jogos</Text>
      </Pressable>
      <Pressable onPress={() => go('AlojamentoList')} style={{ padding: 16 }}>
        <Text style={{ fontSize: 16 }}>🏛️ Alojamentos</Text>
      </Pressable>
    </View>
  );
}

function Root() {
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }} drawerContent={(p) => <DrawerContent {...p} />}>
      <Drawer.Screen name="App" component={AppStack} options={{ title: 'Início' }} />
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

/* ---------------------------
   Estilos
   --------------------------- */
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
