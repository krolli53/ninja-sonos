ninja-sonos
===========

This driver let's you control your sonos system right from your Ninjablock dashboard.


Installation
============

Manual installation:
- ssh to your client
- cd to client/drivers, native ninjablock: `cd /opt/ninja/drivers`
- git clone git://github.com/svrooij/ninja-sonos.git
- cd ninja-sonos && npm install


To-Do
=====

- [x] Added Sonos players trough the driver settings
- [x] One relay switch for pause / resume music
- [x] One relay that can be switched on for a barking dog. (Can I create a button actuator, for use in the rules engine? And this one should not create the queue, but works for now.)
- [x] Some kind of TTS for anouncements http://translate.google.com/translate_tts?tl=en&q=Someone%20at%20the%20door
- [x] Enable custom TTS right from the dashboard / rules (~~any help on how to get the text to the device??~~ Thanks @elliots)
- [ ] Continue playing the music after barking dog (getting the queue doesn't work yet)
- [ ] Continue playing after TTS

