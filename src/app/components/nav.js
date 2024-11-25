'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from '../styles/nav.module.css';

export default function Nav() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const currentPath = usePathname();

    const pages = [
        { name: 'ARTISTS', path: '/artists', delay: '0s' },
        { name: 'EXHIBITIONS', path: '/exhibitions', delay: '0.1s' },
        { name: 'HEADQUARTERS', path: '/headquarters', delay: '0.2s' },
        { name: 'FAIRS', path: '/fairs', delay: '0.3s' },
        // { name: 'RESIDENCIES', path: '/tra', delay: '0.4s' },
        { name: 'ABOUT', path: '/about', delay: '0.4s' },
        { name: 'CONTACT', path: '/contact', delay: '0.5s' },
    ];

    const toggleMenu = () => {
        setIsMenuOpen((prev) => !prev);
    };

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
            <button className={styles.navButton} id="menuButton" onClick={toggleMenu}>
                ☰
            </button>
            <div className={`${styles.nav_list} ${isMenuOpen ? styles.active : ''}`} id="navMenu">
                <ul>
                    {pages.map((page, index) => (
                        <li key={index} style={{ '--delay': page.delay }}>
                            <Link
                                href={page.path}
                                className={isCurrent(page.path) ? styles.page_current : ''}
                                onClick={() => setIsMenuOpen(false)} // Close menu on click
                            >
                                {page.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
