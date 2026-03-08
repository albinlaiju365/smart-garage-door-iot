#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>
#include <PubSubClient.h> // Library: "PubSubClient" by Nick O'Leary

// --- WIFI CONFIGURATION ---
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// --- CLOUD CONFIGURATION ---
const char* mqtt_broker = "broker.hivemq.com";
const char* USER_ID = "my_garage_9988_unique"; // MUST MATCH Next.js API
const char* topic_cmd = "my_garage_9988_unique/cmd";
const char* topic_stat = "my_garage_9988_unique/status";

WiFiClient espClient;
PubSubClient client(espClient);
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(0x40);

// --- SERVO CONFIGURATION ---
#define SERVO_CHANNEL 0
#define SERVOMIN 150  // 0 degrees
#define SERVOMAX 600  // 180 degrees (Full range for SG90)

void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) message += (char)payload[i];
  
  Serial.print("Cloud Command: ");
  Serial.println(message);

  if (message == "OPEN") {
    pwm.setPWM(SERVO_CHANNEL, 0, SERVOMAX);
    client.publish(topic_stat, "open", true);
    Serial.println("Door Opened");
  } else if (message == "CLOSE") {
    pwm.setPWM(SERVO_CHANNEL, 0, SERVOMIN);
    client.publish(topic_stat, "closed", true);
    Serial.println("Door Closed");
  } else if (message == "STOP") {
      // For standard servos, STOP is just maintaining current position
      client.publish(topic_stat, "stopped", true);
      Serial.println("Door Stopped");
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT Broker...");
    // Attempt to connect
    if (client.connect(USER_ID)) {
      Serial.println("CONNECTED");
      client.subscribe(topic_cmd);
      // Publish initial state
      client.publish(topic_stat, "closed", true);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  // I2C Pins for ESP32
  Wire.begin(21, 22);
  
  // Initialize PCA9685
  pwm.begin();
  pwm.setPWMFreq(60);
  pwm.setPWM(SERVO_CHANNEL, 0, SERVOMIN);

  // WiFi
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");

  client.setServer(mqtt_broker, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
