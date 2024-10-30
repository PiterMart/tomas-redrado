"use client"
import Image from "next/image";
import styles from "../styles/page.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Home() {

  const currentPath = usePathname();

  const artistas = [
    { name: 'Jessica Trosman', path: '/artists/JessicaTrosman'},
    { name: 'Francisco Montes', path: '/artists/JessicaTrosman'},
    { name: 'Luna Sudaca ', path: '/artists/JessicaTrosman'},
    { name: 'Flavia Da Rin', path: '/artists/JessicaTrosman'},
    { name: 'Jessica Trosman', path: '/artists/JessicaTrosman'},
    { name: 'Francisco Montes', path: '/artists/JessicaTrosman'},
    { name: 'Luna Sudaca ', path: '/artists/JessicaTrosman'},
    { name: 'Flavia Da Rin', path: '/artists/JessicaTrosman'},
    { name: 'Jessica Trosman', path: '/artists'},
    { name: 'Francisco Montes', path: '/artists/JessicaTrosman'},
    { name: 'Luna Sudaca ', path: '/artists/JessicaTrosman'},
    { name: 'Flavia Da Rin', path: '/artists/JessicaTrosman'},
    
  ];
  const isCurrent = (path) => {
    return currentPath === path;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <p className={styles.title}>ARTISTAS</p>
        <div className={styles.artist_page}>
          <div className={styles.artist_list}>
            <ul>
              {artistas.map((artist, index) => {
                return (
                <li key={index}>
                  <Link 
                  onClick={() => {setIsActive(!isActive)}}
                  href={artist.path} 
                  alt={artist.name} 
                  className={isCurrent(artist.path) ? 'page_current__pRY1c' : '' }
                  >
                  {artist.name}
                  </Link>
                </li>
                )
              })}
            </ul>
          </div>
          <div style={{background: 'lightgray', width: '100%', justifyContent: 'center', alignContent: 'center'}}>
            <Image
              src="/TomasRedradoLogo.svg"
              alt="TomasRedrado"
              width={500}
              height= {500}
              loading="lazy"
              style={{margin: 'auto', width: '50%', display: 'block'}}
              // className={styles.hero_image}
            />
          </div>
        </div>
        {/* <Link href="/artists/">
        <button> ZYNTAX</button>
        </Link> */}
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
