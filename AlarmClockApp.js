import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Vibration,
  Switch,
  Modal,
  Button,
  
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';



const AlarmClockApp = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [alarms, setAlarms] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedAlarmTone, setSelectedAlarmTone] = useState('Default');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    loadAlarms();
  }, []);

  const loadAlarms = async () => {
    try {
      const storedAlarms = await AsyncStorage.getItem('alarms');
      if (storedAlarms) {
        setAlarms(JSON.parse(storedAlarms));
      }
    } catch (error) {
      console.error('Error loading alarms:', error);
    }
  };

  const saveAlarms = async () => {
    try {
      await AsyncStorage.setItem('alarms', JSON.stringify(alarms));
    } catch (error) {
      console.error('Error saving alarms:', error);
    }
  };

  const addAlarm = () => {
    if (selectedTime) {
      setAlarms([...alarms, { time: selectedTime, isActive: true, tone: selectedAlarmTone }]);
      setSelectedTime(null);
      setModalVisible(false);
    }
  };

  const deleteAlarm = (index) => {
    const updatedAlarms = [...alarms];
    updatedAlarms.splice(index, 1);
    setAlarms(updatedAlarms);
  };

  const toggleAlarm = (index) => {
    const updatedAlarms = [...alarms];
    updatedAlarms[index].isActive = !updatedAlarms[index].isActive;
    setAlarms(updatedAlarms);
  };

  const [showTimePicker, setShowTimePicker] = useState(false);

const openTimePicker = () => {
  setShowTimePicker(true);
};

const handleTimePickerChange = (event, selectedTime) => {
  setShowTimePicker(false);
  if (event.type === 'set') {
    const hours = selectedTime.getHours();
    const minutes = selectedTime.getMinutes();
    const formattedTime = `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
    setSelectedTime(formattedTime);
  }
};
const checkVibratePermission = async () => {
    const permissionStatus = await check(PERMISSIONS.ANDROID.VIBRATE);
    if (permissionStatus === RESULTS.DENIED) {
      const requestStatus = await request(PERMISSIONS.ANDROID.VIBRATE);
      if (requestStatus === RESULTS.GRANTED) {
        // Permission granted, you can use Vibration API
      } else {
        // Permission denied, handle accordingly
      }
    }
  }; 
  const [snoozeTime, setSnoozeTime] = useState(5);
  const snoozeAlarm = (alarm) => {
    const snoozeInterval = snoozeTime * 60 * 1000; // Convert minutes to milliseconds
    const alarmIndex = alarms.findIndex((item) => item.time === alarm.time);

    if (alarmIndex !== -1) {
      // Clone the alarms array to avoid modifying the state directly
      const updatedAlarms = [...alarms];
      const snoozeTime = new Date().getTime() + snoozeInterval;
      updatedAlarms[alarmIndex].time = new Date(snoozeTime);
      updatedAlarms[alarmIndex].isActive = true;

      setAlarms(updatedAlarms);
      setSelectedTime(null); // Reset the selected time
    }
  };

  const dismissAlarm = (alarm) => {
    const updatedAlarms = alarms.filter((item) => item.time !== alarm.time);
    setAlarms(updatedAlarms);
  };
  
  const triggerAlarm = (alarm) => {
    Vibration.vibrate([1000, 1000, 1000]);
    
  };

  useEffect(() => {
    alarms.forEach((alarm, index) => {
      if (alarm.isActive) {
        const [hours, minutes] = alarm.time.split(':');
        const alarmTime = new Date();
        alarmTime.setHours(parseInt(hours, 10));
        alarmTime.setMinutes(parseInt(minutes, 10));
        alarmTime.setSeconds(0);
        const now = new Date();
        if (now.getHours() === alarmTime.getHours() && now.getMinutes() === alarmTime.getMinutes()) {
          triggerAlarm(alarm);
          toggleAlarm(index);
        }
      }
    });
  }, [alarms]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Alarm Clock App</Text>
      <Text style={styles.dateTime}>
        {currentDate.toLocaleDateString()} {currentDate.toLocaleTimeString()}
      </Text>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
        <Text style={{alignSelf:'center'}}>Add Alarm</Text>
      </TouchableOpacity>

      <FlatList
        data={alarms}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.alarmItem}>
            <Text>{item.time}</Text>
            <Text>Active</Text>
            <Switch
              value={item.isActive}
              onValueChange={() => toggleAlarm(index)}
            />
            <TouchableOpacity onPress={() => deleteAlarm(index)} style={styles.deleteButton}>
              <Text>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => snoozeAlarm(item)} style={styles.snoozeButton}>
  <Text>Snooze</Text>
</TouchableOpacity>
<TouchableOpacity onPress={() => dismissAlarm(item)} style={styles.dismissButton}>
  <Text>Dismiss</Text>
</TouchableOpacity>


          </View>
        )}
      />



<Modal animationType="slide" transparent={false} visible={isModalVisible}>
  <View style={styles.modalContainer}>
    <Text style={styles.modalHeader}>Set Alarm</Text>
    <TouchableOpacity onPress={openTimePicker} style={styles.timePickerButton}>
      <Text>Set Time</Text>
    </TouchableOpacity>
    <Text>Selected Time: {selectedTime}</Text>
    {showTimePicker && (
      <DateTimePicker
        value={new Date()} // You can set an initial value if needed
        mode="time"
        is24Hour={true}
        display="spinner"
        onChange={handleTimePickerChange}
      />
    )}
    <Button title="Save Alarm" onPress={addAlarm} />
    <Button title="Cancel" onPress={() => setModalVisible(false)} />
  </View>
</Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding:100,
    fontSize: 30,
    color:'red',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dateTime: {
    color: 'orange',
    padding: 25,
    fontSize: 30,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: 'orange',
    padding: 10,
    width:200,
    borderRadius: 15,
  },
  alarmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
    width: '80%',
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 5,
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 24,
    color:'red',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timePickerButton: {
    backgroundColor: 'orange',
    padding: 10,
    width: 200,
    borderRadius: 15,
  },
});

export default AlarmClockApp;
