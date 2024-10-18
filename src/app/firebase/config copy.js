"use client"
import { initializeApp } from "firebase/app";
import { getFirestore,doc, setDoc, addDoc, collection} from "firebase/firestore";
import styles from "../styles/page.module.css";
import React from "react";

export default function ArtistForm() {

    const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore();

    const artistsCollection = collection(firestore, 'artistas')

    async function addNewArtist() {
        const newArtist = await  addDoc(artistsCollection, {
            bio:"He makes good beats",
            nombre: "verts",
            obras: "link_to_obras",
            web: "www.vert.com"
        });
        console.log("doc created at ${newArtist.path}");
        
    }

    console.log("currently uploading")
    // writeArtistList();
    addNewArtist();

    return (
      <div className={styles.form}>
        <input name="bio"></input>
        <button onClick={addNewArtist}>
          upload
        </button>
      </div>
    );
  }
  
