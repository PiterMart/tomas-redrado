import { app, firestore, storage } from "./firebaseConfig";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";

const deleteArtist = async () => {
  // Check if artistId prop is provided
  if (!artistId) {
    console.error("Artist ID is not defined");
    return;
  }

  try {
    // Delete the profile picture if it exists
    if (artistData.profilePicture) {
      const profilePicRef = ref(storage, artistData.profilePicture);
      await deleteObject(profilePicRef);
    }

    // Delete each gallery image
    for (const obra of artistData.obras) {
      const imageRef = ref(storage, obra.url);
      await deleteObject(imageRef);
    }

    // Delete the artist's document in Firestore
    await deleteDoc(doc(firestore, "artistas", artistId));

    alert("Artist deleted successfully!");
    onClose();
  } catch (error) {
    console.error("Error deleting artist:", error);
    alert("Failed to delete artist. Please try again.");
  }
};

export { deleteArtist};