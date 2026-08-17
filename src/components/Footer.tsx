import Image from "next/image";
import { LiaFacebookF, LiaLinkedinIn, LiaTwitter, LiaYoutube } from "react-icons/lia";
import styles from "./Footer.module.css";

const LINK_COLUMNS = [
  {
    heading: "Company",
    links: ["About Us", "Careers", "Contact", "Locations"],
  },
  {
    heading: "Resources",
    links: ["How It Works", "FAQs", "Blog", "Support Center"],
  },
  {
    heading: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Cookie Preferences", "Accessibility"],
  },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Image src="/logo-light.svg" alt="The Block" width={140} height={19} className={styles.logoImage} />
            <p className={styles.tagline}>Wholesale vehicle auctions, simplified.</p>
          </div>

          <div className={styles.columns}>
            {LINK_COLUMNS.map((column) => (
              <div key={column.heading} className={styles.column}>
                <p className={styles.columnHeading}>{column.heading}</p>
                <ul className={styles.linkList}>
                  {column.links.map((link) => (
                    <li key={link}>
                      <span className={styles.link}>{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>© 2026 OPENLANE. All Rights Reserved.</p>
          <div className={styles.social}>
            <span className={styles.socialIcon} aria-hidden="true">
              <LiaFacebookF />
            </span>
            <span className={styles.socialIcon} aria-hidden="true">
              <LiaTwitter />
            </span>
            <span className={styles.socialIcon} aria-hidden="true">
              <LiaLinkedinIn />
            </span>
            <span className={styles.socialIcon} aria-hidden="true">
              <LiaYoutube />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
