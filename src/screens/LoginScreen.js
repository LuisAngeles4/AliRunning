// src/screens/LoginScreen.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { auth } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_700Bold_Italic,
} from "@expo-google-fonts/poppins";
import AppLoading from "expo-app-loading";

import InputField from "../components/InputField";
import AppButton from "../components/AppButton";
import ErrorMessage from "../components/ErrorMessage";
import { Ionicons } from "@expo/vector-icons";

// ⬇️ nuevo: guardar el usuario activo para el historial por cuenta
import { setCurrentUser } from "../utils/storage";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Fuente Poppins
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_700Bold_Italic,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const u = cred?.user;
      // Guarda el id de la cuenta activa (usa uid estable de Firebase)
      await setCurrentUser(u?.uid || email.toLowerCase());
      setError("");
      navigation.replace("MainTabs");
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("Usuario no registrado");
          console.log("error usuario no registrado");
          break;
        case "auth/wrong-password":
          setError("Contraseña incorrecta");
          console.log("error usuario contraseña incorrecta");
          break;
        default:
          setError("Error al iniciar sesión");
          console.log("error al iniciar sesion", err?.code || err?.message);
      }
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const u = cred?.user;
      // También fijamos el usuario activo tras registrarse
      await setCurrentUser(u?.uid || email.toLowerCase());
      setError("");
      // Opcional: entrar directo a la app
      navigation.replace("MainTabs");
    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Este usuario ya existe");
          console.log("error usuario ya existe");
          break;
        case "auth/invalid-email":
          setError("Correo inválido");
          console.log("correo invalido");
          break;
        case "auth/weak-password":
          setError("La contraseña debe tener al menos 6 caracteres");
          console.log("error contraseña débil");
          break;
        default:
          setError("Error al registrarse");
          console.log("error al registrarse", err?.code || err?.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo (opcional) */}
      <Image
        // source={require("../assets/logo.png")}
        // style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>BIENVENIDO</Text>

      <InputField
        value={email}
        onChangeText={(text) => setEmail(text.toLowerCase())}
        placeholder="Email"
      />

      <View style={styles.passwordContainer}>
        <InputField
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña"
          secureTextEntry={!showPassword}
          style={{ flex: 1 }}
        />

        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

      <ErrorMessage message={error} />

      <AppButton title="INICIAR SESIÓN" onPress={handleLogin} variant="gold" />
      <AppButton title="REGISTRARSE" onPress={handleRegister} variant="white" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // negro
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700", // dorado
    fontFamily: "Poppins_700Bold_Italic",
    marginBottom: 20,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
  },
});
