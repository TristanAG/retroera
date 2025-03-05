import { useState } from 'react'
import './App.css'
import { db } from './firebase';  // Import Firestore
import { collection, getDocs } from 'firebase/firestore';

function App() {

  // Test Firestore
const testFirestore = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'test'));
    console.log('Firestore connection successful:', querySnapshot.docs.map(doc => doc.data()));
  } catch (error) {
    console.error('Error connecting to Firestore:', error);
  }
};

testFirestore(); // Run the test
  const [count, setCount] = useState(0)

  return (
    <>
      <h3>RetroBay 📀 🌊</h3>
      <button>New Game +</button>
    </>
  )
}

export default App
