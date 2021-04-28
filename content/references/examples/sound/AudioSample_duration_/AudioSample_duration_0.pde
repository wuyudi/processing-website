import processing.sound.*;
AudioSample sample;

void setup() {
  size(640, 360);
  background(255);

  // Create a new audiosample
  sample = new AudioSample(this, 88200, 22050);

  // 88200 samples at a sample rate of 22050 should return 4.0 seconds
  println("Duration= " + sample.duration() + " seconds");
}      

void draw() {
}
