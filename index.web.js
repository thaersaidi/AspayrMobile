import { AppRegistry } from 'react-native';
import App from './App';

// Register the app for web
AppRegistry.registerComponent('AspayrMobile', () => App);

// Run the app
AppRegistry.runApplication('AspayrMobile', {
  rootTag: document.getElementById('root'),
});
