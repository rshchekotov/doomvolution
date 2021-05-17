#!/bin/bash

#Ensure that Node is 100% dead
killall node

# A Delay for no reason
sleep 2

# Restart the Bot
yarn start:dev