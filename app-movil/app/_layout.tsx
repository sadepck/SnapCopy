import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'SnapCopy', 
            headerStyle: { backgroundColor: '#000F0A' }, 
            headerTintColor: '#00DF81',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontWeight: 'bold' }
          }} 
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
