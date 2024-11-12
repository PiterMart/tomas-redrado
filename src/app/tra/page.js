import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%'}}>
            <p className={styles.title}>Tomas Redrado Art</p>
            <p> Contemporary art asks that we begin to look at the world in a different way, outside of the prevailing logic and status quo. It puts us into situations of inquisitiveness and outside of the security of assured answers. This is a way of being where the interior of the artist prevails before what is deemed politically correct. In this way, the artist breaks through the dams of contention of the establishment, surging out abstractions with infinite textures, materials and colors. What emerges gives us an art object that we can question, and questions us in return.</p>
            <p>An artist’s freedom put into action demands the need for dialogue with people who stimulate and protect that freedom. This is how Tomás Redrado understands his role in  contemporary Latin American art and art in general. There is no calling or mission without first committing oneself to the reality in which we are involved in. The different courses Tomás has treaded, his intellectual and academic coursework, experiential and experimental ways of understanding – have led him to be an individual who always faces the challenges that life proposes to him. After unintentionally deciding to settle in Miami and opening a professional art space, he renews what Inventionism did to Buenos Aires and MonteVideo, like what Neoconcretism did to Rio de Janeiro.</p>
            <p>Before ever coming to create his space, Tomás had already envisioned the idea of getting involved with institutions and officials from the spheres of cultural management in Miami. But still, that seemed too narrow in scope, both for him and the artists who had already begun generating the dialogue required in a professional, contemporary art space. The goal was to promote, investigate, and generate criticism of contemporary art on an international and global scale.</p>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
