import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function App() {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<string | null>(null);
  const [inputName, setInputName] = useState(''); // Untuk form registrasi
  const [status, setStatus] = useState('idle'); // idle | scanning | registering | logged_in

  // 1. Cek Hardware saat aplikasi dibuka
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync(); // Cek ada sidik jari terdaftar di HP gak
      setIsBiometricSupported(compatible && enrolled);
    })();
  }, []);

  // 2. Fungsi Utama: Scan Fingerprint
  const handleBiometricScan = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifikasi Identitas Anda',
        cancelLabel: 'Batal',
        disableDeviceFallback: true,
      });

      if (result.success) {
        // Jika sidik jari cocok, cek database
        checkUserRegistration();
      } else {
        Alert.alert('Gagal', 'Sidik jari tidak dikenali.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 3. Logic: Cek Database Lokal
  const checkUserRegistration = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user_identity');
      
      if (storedUser !== null) {
        // Kalo ada datanya -> LOGIN BERHASIL
        setUserData(storedUser);
        setStatus('logged_in');
      } else {
        // Kalo kosong -> MASUK MODE REGISTRASI
        setStatus('registering');
      }
      setIsAuthenticated(true);
    } catch (e) {
      Alert.alert('Error', 'Gagal membaca database.');
    }
  };

  // 4. Logic: Simpan Data Baru (Register)
  const handleRegister = async () => {
    if (inputName.trim() === '') {
      Alert.alert('Error', 'Nama tidak boleh kosong!');
      return;
    }

    try {
      await AsyncStorage.setItem('user_identity', inputName);
      setUserData(inputName);
      setStatus('logged_in');
      Alert.alert('Sukses', 'Sidik jari Anda sekarang terhubung dengan: ' + inputName);
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan data.');
    }
  };

  // 5. Reset (Buat ngetes ulang flow-nya)
  const handleReset = async () => {
    await AsyncStorage.removeItem('user_identity');
    setUserData(null);
    setIsAuthenticated(false);
    setStatus('idle');
    setInputName('');
    Alert.alert('Reset', 'Database dikosongkan. Silakan scan ulang.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Dactylos Mobile</Text>
        
        {/* INITIAL STATE */}
        {status === 'idle' && (
          <View style={styles.card}>
            <Text style={styles.instruction}>
              {isBiometricSupported 
                ? 'Sentuh sensor untuk identifikasi.' 
                : 'Device ini tidak support biometrik.'}
            </Text>
            
            {isBiometricSupported && (
              <TouchableOpacity style={styles.scanButton} onPress={handleBiometricScan}>
                <Text style={styles.btnText}>SCAN FINGERPRINT</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* REGISTER STATE (Fingerprint Valid, tapi Data Kosong) */}
        {status === 'registering' && (
          <View style={styles.card}>
            <Text style={styles.statusBadge}>FINGERPRINT VERIFIED</Text>
            <Text style={styles.instruction}>Sidik jari ini belum terdaftar.</Text>
            <Text style={styles.subText}>Siapa nama pemilik sidik jari ini?</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Masukkan Nama Anda"
              placeholderTextColor="#666"
              value={inputName}
              onChangeText={setInputName}
            />
            
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <Text style={styles.btnText}>REGISTER FINGERPRINT</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LOGGED IN STATE (Fingerprint Valid, Data Ada) */}
        {status === 'logged_in' && (
          <View style={styles.card}>
             <Text style={styles.statusBadgeSuccess}>IDENTITY CONFIRMED</Text>
             <Text style={styles.welcomeText}>Halo,</Text>
             <Text style={styles.userName}>{userData}</Text>
             <Text style={styles.subText}>Akses diberikan.</Text>

             <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
               <Text style={styles.resetText}>[ Reset Database ]</Text>
             </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center' },
  content: { padding: 20, alignItems: 'center' },
  title: { fontSize: 28, color: '#d4af37', fontWeight: 'bold', marginBottom: 40, letterSpacing: 2 },
  card: { width: '100%', alignItems: 'center', backgroundColor: '#222', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  instruction: { color: '#ccc', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  subText: { color: '#888', fontSize: 14, marginBottom: 10, textAlign: 'center' },
  
  scanButton: { backgroundColor: '#d4af37', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 50, marginTop: 10 },
  registerButton: { backgroundColor: '#4a90e2', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 50, marginTop: 10, width: '100%', alignItems: 'center' },
  resetButton: { marginTop: 40 },
  
  btnText: { color: '#000', fontWeight: 'bold', letterSpacing: 1 },
  resetText: { color: '#d9534f', fontSize: 12 },
  
  input: { width: '100%', backgroundColor: '#333', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16, textAlign: 'center', borderWidth: 1, borderColor: '#555' },
  
  statusBadge: { color: '#4a90e2', fontWeight: 'bold', fontSize: 12, letterSpacing: 1, marginBottom: 10, backgroundColor: 'rgba(74, 144, 226, 0.1)', padding: 5, borderRadius: 5 },
  statusBadgeSuccess: { color: '#2ecc71', fontWeight: 'bold', fontSize: 12, letterSpacing: 1, marginBottom: 10, backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: 5, borderRadius: 5 },
  
  welcomeText: { color: '#fff', fontSize: 20 },
  userName: { color: '#d4af37', fontSize: 32, fontWeight: 'bold', marginVertical: 10 },
});