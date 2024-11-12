'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from '../styles/page.module.css';

export default function Nav() {
    const [isActive, setIsActive] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const currentPath = usePathname();

    const pages = [
        { name: 'ARTISTAS', path: '/artists' },
        { name: 'EXHIBICIONES', path: '/exhibiciones' },
        { name: 'FERIAS', path: '/ferias' },
        { name: 'SOBRE TRA', path: '/tra' },
    ];

    const isCurrent = (path) => {
        return currentPath === path;
    };

    const controlNavbar = () => {
        if (typeof window !== 'undefined') {
            if (window.scrollY > lastScrollY) {
                // scrolling down
                setIsVisible(false);
            } else {
                // scrolling up
                setIsVisible(true);
            }
            setLastScrollY(window.scrollY);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', controlNavbar);
            return () => {
                window.removeEventListener('scroll', controlNavbar);
            };
        }
    }, [lastScrollY]);

    return (
        <div className={`${styles.nav} ${isVisible ? styles.nav_visible : styles.nav_hidden}`}>
            <Link href="/">
                <Image
                    src="/TomasRedradoLogo.svg"
                    alt="TomasRedrado"
                    width={0}
                    height={0}
                    loading="lazy"
                    className={styles.nav_logo}
                />
            </Link>
            <div className={styles.nav_list}>
                <ul>
                    {pages.map((page, index) => {
                        return (
                            <li key={index}>
                                <Link
                                    onClick={() => {
                                        setIsActive(!isActive);
                                    }}
                                    href={page.path}
                                    alt={page.name}
                                    className={isCurrent(page.path) ? 'page_current__pRY1c' : ''}
                                >
                                    {page.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
