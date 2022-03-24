// react functional component to render the main logo
import React, { useState, useEffect } from 'react';
import logo from '../../../assets/salespot-logo-long.png';
import logoDark from '../../../assets/salespot-logo-long-dark.png';

export default function LongLogo() {
  const [saleSpotLogo, setSaleSpotLogo] = useState(logo);

  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      setSaleSpotLogo(logo);
    } else {
      setSaleSpotLogo(logoDark);
    }
  }, []);

  return <img src={saleSpotLogo} alt="SaleSpot" />;
}
