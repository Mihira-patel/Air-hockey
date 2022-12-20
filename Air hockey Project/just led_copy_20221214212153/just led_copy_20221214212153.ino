#include <FastLED.h>
#define LED_PIN1 3
#define LED_PIN2 4
#define NUM_LEDS 35
CRGB leds1[NUM_LEDS];
CRGB leds2[NUM_LEDS];
int incomingByte;

void setup() {
  Serial.begin(9600);
  FastLED.addLeds<WS2812B, LED_PIN1, GRB>(leds1, NUM_LEDS);
  FastLED.addLeds<WS2812B, LED_PIN2, GRB>(leds2, NUM_LEDS);
}

void loop() {
  if (Serial.available() > 0) { // see if there's incoming serial data
  incomingByte   = Serial.read(); // read it
    if (incomingByte == 'a') {   
        for (int i = 0; i < NUM_LEDS; i++) {
          leds1[i] = CRGB::Red;
          FastLED.show();
          delay(50);
        } 
         for (int i = 0; i < NUM_LEDS; i++) {
          leds1[i] = CRGB::Green;
          FastLED.show();
        }
    }
    if (incomingByte == 'b') {      
      for (int i = 0; i < NUM_LEDS; i++) {
          leds2[i] = CRGB::Cyan;
          FastLED.show();
          delay(50);
        } 
         for (int i = 0; i < NUM_LEDS; i++) {
          leds2[i] = CRGB::Green;
          FastLED.show();
        }
        }
       }
      }
    



