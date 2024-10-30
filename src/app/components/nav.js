'use client'
import React from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "../styles/page.module.css";

export default function Nav() {

    const  [isActive, setIsActive] = useState(false);

    const currentPath = usePathname();

    const pages = [
        { name: 'ARTISTAS', path: '/artists'},
        { name: 'EXHIBCIONES', path: '/exhibiciones'},
        { name: 'FERIAS', path: '/ferias'},
        { name: 'SOBRE TRA', path: 'tra'},
    ];

    const isCurrent = (path) => {
        return currentPath === path;
    }

    return (
        
        <div className={styles.nav} >
            <Link href="/">
                <Image
                    src="/TomasRedradoLogo.svg"
                    alt="TomasRedrado"
                    width={0}
                    height= {0}
                    loading="lazy"
                    className={styles.nav_logo}
                />
            </Link>
            <div className={styles.nav_list}>
                <ul
                >
                    {pages.map((page, index) => {
                        return (
                            <li key={index}>
                                <Link 
                                    onClick={() => {setIsActive(!isActive)}}
                                    href={page.path} 
                                    alt={page.name} 
                                    className={isCurrent(page.path) ? 'page_current__pRY1c' : '' }
                                >
                                    {page.name}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}