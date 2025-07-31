"use client";
import { useState } from "react"; // NEW: Import useState
import styles from "../styles/page.module.css";

// NEW: Object to hold the hardcoded bilingual content.
// Each language has an array of strings, where each string is a paragraph.
const content = {
  en: [
    "TOMAS REDRADO ART (TRA)",
    "is committed to promoting the appreciation and recognition of contemporary art through a dynamic and historically grounded aesthetic. Since its founding in 2022, the gallery has worked to build a vibrant artistic community, representing emerging and mid-career artists from Latin America whose works explore the boundaries of form, texture, and materiality. Through sustained and dedicated engagement with contemporary practices, TRA aims to position its artists' productions within the international art circuit.",
    "TRA challenges conventional perspectives and encourages the exploration of innovative artistic forms, prioritizing the creative autonomy of artists and fostering an environment where breaking boundaries and engaging closely with the public are central.",
    "With headquarters in Miami and José Ignacio, a temporary programming in Buenos Aires, and a forthcoming new location in the same city, TRA seeks to foster dialogue between local and international art scenes. Its mission is to create meaningful exchanges that reaffirm its commitment to connecting the region’s cultural richness with the global stage, generating an impact that transcends borders through a program that is rooted yet constantly moving and evolving in dialogue.",
    "In 2025, TRA consolidates this vision by participating in three key international art fairs — arteBA, ArtBo, and NADA Miami — expanding visibility and collecting opportunities for its artists and strengthening its presence in the global contemporary art scene.",
  ],
  es: [
    "TOMAS REDRADO ART (TRA)" ,
    "está comprometido a promover la valoración y el reconocimiento del arte contemporáneo a través de una estética dinámica e históricamente arraigada. Desde su fundación en 2022, la galería ha trabajado en construir una comunidad artística pujante, representando a artistas emergentes y de mediana carrera de América Latina, con obras que exploran los límites de la forma, la textura y la materialidad. A través de un trabajo sostenido y dedicado con lo contemporáneo, TRA se propone el establecimiento de sus producciones artísticas en el circuito internacional.",
    "TRA desafía las perspectivas convencionales y fomenta la exploración de formas de arte innovadoras, priorizando la autonomía creativa del artista y promoviendo un entorno donde romper las normas e interactuar de forma cercana con el público.",
    "Con sede en Miami y Arenas José Ignacio, programación temporal en Buenos Aires y una futura nueva sucursal en dicha ciudad, TRA busca dialogar entre las escenas artísticas locales e internacionales a través de un intercambio significativo que reafirma su compromiso de conectar la riqueza cultural de la región con el escenario global, generando un impacto que trascienda fronteras, a partir de un programa situado pero en movimiento y en diálogo constante.",
    "En 2025, TRA consolida esta visión participando en tres ferias internacionales claves — arteBA, ArtBo y NADA Miami—, ampliando así las oportunidades de visibilidad y coleccionismo para sus artistas, y fortaleciendo su presencia dentro del circuito contemporáneo global.",
  ],
};

export default function About() {
  // NEW: State to manage the current language ('en' or 'es')
  const [lang, setLang] = useState('en');

  // NEW: Function to toggle the language
  const toggleLanguage = () => {
    setLang(prevLang => (prevLang === 'en' ? 'es' : 'en'));
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.page_container}>
          <div className={styles.artists_page}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%'}}>
              
              {/* NEW: Language toggle button */}
              <div style={{marginBottom: '1rem'}}>
                <button onClick={toggleLanguage} className={styles.language_button}>
                  {lang === 'en' ? 'Ver en Español' : 'View in English'}
                </button>
              </div>

              {/* UPDATED: Dynamically render content based on language state */}
              {content[lang].map((paragraph, index) => {
                // Apply the 'title' style to the first paragraph
                const isTitle = index === 0;
                return (
                  <p 
                    key={index} 
                    className={isTitle ? styles.title : ''}
                    style={{
                      marginBottom: isTitle ? '1rem' : '0',
                      lineHeight: isTitle ? '3rem' : '1.5rem', // Adjust line height for readability
                      textAlign: 'left',
                      textAlign: 'justify'
                    }}
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>
            <video autoPlay loop muted className={styles.video}>
              <source src="/TomasRedradoExhibition.mp4" />
            </video>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}