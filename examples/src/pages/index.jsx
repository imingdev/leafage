import React from 'react';
import LoggerImage from './images/logger.png';
import styles from './home.css';

const HomePage = () => (
  <div className={styles.container}>
    <img src={LoggerImage} />
    <div>home</div>
  </div>
);

export default HomePage;
