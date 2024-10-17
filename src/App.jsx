import { useState, useEffect } from "react";
import * as Styles from "./Styles";
import Canvas from "./Canvas";
import mqtt from "mqtt";

import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { getUrl } from "aws-amplify/storage";
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);
const client = generateClient({
  authMode: "userPool",
});

function App() {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [subMessages, setSubMessages] = useState(JSON.parse('{"x":1,"y":1}'));
  const [pubMessage, setPubMessage] = useState("");
  const str = [];

  useEffect(() => {
    // MQTTサーバーに接続
    const mqttClient = mqtt.connect(
      "wss://t191933e.ala.asia-southeast1.emqxsl.com:8084/mqtt",
      {
        username: "user001",
        password: "user001",
      }
    );

    mqttClient.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to MQTT broker");
      mqttClient.subscribe("emqx/esp32");
    });

    mqttClient.on("message", (topic, message) => {
      console.log("Received message:", topic, message.toString());
      str.push(message.toString() + "\n");
      if (str.length > 5) {
        str.shift(0);
      }

      try {
        const value = JSON.parse(message.toString());
        setSubMessages(value);
      } catch {
        setSubMessages("");
        console.log("🔵subscribe message is not type of JSON ");
      }
    });

    setClient(mqttClient);

    return () => {
      if (mqttClient) mqttClient.end();
    };
  }, []);

  const publishMessage = () => {
    if (client && isConnected) {
      client.publish("emqx/esp32", pubMessage);
      setPubMessage("");
    }
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <>
          <Canvas command={subMessages} client={client} user={user} signOut={signOut}/>
        </>
      )}
    </Authenticator>
  );
}

export default App;
