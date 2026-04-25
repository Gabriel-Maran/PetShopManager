import { View, Text, StyleSheet, Image } from "react-native";
import Calendario from "../components/Calendario";


export default function Home() {
  return (
    <View style={styles.container}>
        <View style={{ backgroundColor: '#fff'}}>
            <Image 
                source={require('../../assets/logoPetShopFundoBranco.png')} 
                style={{ width: 150, height: 50, alignSelf: 'center'}} 
            />
        </View>
        <View>
            <Calendario />
        </View>
      <Text>Home Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});