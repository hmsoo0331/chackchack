import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from './src/store/useStore';

import SplashScreen from './src/screens/SplashScreen';
import CreateQRScreen from './src/screens/CreateQRScreen';
import QRCompleteScreen from './src/screens/QRCompleteScreen';
import MyQRListScreen from './src/screens/MyQRListScreen';
import LoginScreen from './src/screens/LoginScreen';

const Stack = createStackNavigator();

export default function App() {
  const { setAuth } = useStore();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const ownerData = await AsyncStorage.getItem('owner');
      
      if (token && ownerData) {
        const owner = JSON.parse(ownerData);
        setAuth(token, owner);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CreateQR" 
          component={CreateQRScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="QRComplete" 
          component={QRCompleteScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MyQRList" 
          component={MyQRListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
