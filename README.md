ninja-sonos
===========

This driver let's you control your sonos system right from your Ninjablock dashboard.


Installation
============

Manual installation:
- ssh to your client
- become root `sudo su` and then yourPassword
- cd to client/drivers, native ninjablock: `cd /opt/ninja/drivers`
- git clone git://github.com/svrooij/ninja-sonos.git
- cd ninja-sonos && npm install
- restart the ninja client, native ninjablock `service ninjablock restart` or `reboot`

To-Do
=====

This is a complete rewrite of the driver, but this specifies what already works and what doesn't (yet)

- [x] Adding Sonos players trough the driver settings
- [x] One generic state device for each sonos player (states that you should add 'stopped', 'playing', 'dogs', 'doorbell')
  [x] State for Barking dogs `dogs` and a state for the Two Tone doorbell `doorbell`.
- [x] More states ('radio1', 'radio2', 'radio3') with urls that can be configured in the settings.
- [x] Dutch announcements by using the above states and this url 'http://i872953.iris.fhict.nl/speech/nl-nl_Er%20staat%20iemand%20aan%20de%20deur.mp3'
- [x] English announcements by using the above states and this url 'http://i872953.iris.fhict.nl/speech/en-us_You%20got%20a%20visitor.mp3'
- [ ] Enable custom TTS right from the dashboard / rules (~~any help on how to get the text to the device??~~ Thanks @elliots) (this needs to be rewritten in the new driver.)
- [ ] Continue playing the music after barking dog (getting the queue doesn't work yet, but partially implemented with the new states)
- [ ] Continue playing after TTS (same as above)
