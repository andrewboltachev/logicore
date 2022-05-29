import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useMemo,
  useRef,
  useContext,
} from "react";
import {
  BrowserRouter as Router,
  Switch as Routes,
  Route,
  Link,
  useLocation,
  useHistory,
} from "react-router-dom";
import classd from "classd";
import * as Layout from "../components/layouts";
import * as Input from "../components/inputs";
import Footer from "../components/footer";


import { Logo, Menu, Person, Advantage1, Advantage2, Advantage3, Advantage4, FooterLogo, Rect1, Rect2, Rect3, Telegram, Vk, Facebook, Instagram, Whatsapp, TelegramNav, WhatsappNav, InstagramNav, FacebookNav, StarNav, BreadHome, Suitcase, Signal, Wifi, Electricity, Quote } from "../elements";
import * as elements from "../elements";

import * as Button from "../components/buttons";

import TourSearchForm, { searchFormToUrlParts } from "../components/tour-search-form";

export function Navbar({ layout }) {
  const variantDefs = {
    variant1: {
      hero: "light-intense",
      outer: "light-intense",
      inner: "dark",
    },
    variant2: {
      hero: "light",
      outer: "light",
      inner: "regular",
    },
    variant3: {
      hero: "light",
      outer: "light",
      inner: "pastell",
    },
  }
  const variants = {};
  for (const [k, v] of Object.entries(variantDefs)) {
    variants[k] = v[layout];
  }
  const { variant1, variant2, variant3 } = variants;
  return (
    <div className="th-navbar">
    <div className="th-navbar__inner">
      <div className="th-navbar__logo-container">
        <Link to="/"><Logo /></Link>
      </div>
      <div className="th-navbar__rest-container">
        <div className="th-navbar__left">
          <div className="th-navbar__group th-d-none th-d-tablet-flex">
            <div className="th-navbar__gap" />
            <div className="th-navbar__gap" />
            <div className="th-navbar__text">
              <Button.Text variant={variant1} to="/catalog">Каталог путешествий</Button.Text>
            </div>
            <div className="th-navbar__gap" />
            <div className="th-navbar__gap" />
            <div className="th-navbar__text">
              <Button.Text variant={variant1} to="/how-to-buy">Как купить</Button.Text>
            </div>
            <div className="th-navbar__group th-d-none th-d-desktop-flex">
              <div className="th-navbar__gap" />
              <div className="th-navbar__gap" />
              <Input.TextSearch variant={variant3} icon="Search" />
              <div className="th-navbar__gap" />
              <Button.Circular variant={variant3} icon="Star" />
            </div>
          </div>
        </div>
        <div className="th-navbar__right">
          <div className="th-navbar__group th-d-none th-d-desktop-flex">
            <div className="th-navbar__social">
              <Button.Icon variant={variant1} icon="SocialVK" />
              <Button.Icon variant={variant1} icon="SocialFacebook" />
              <Button.Icon variant={variant1} icon="SocialInstagram" />
              <Button.Icon variant={variant1} icon="SocialWhatsApp" />
              <Button.Icon variant={variant1} icon="SocialTelegram" />
            </div>
            <div className="th-navbar__gap" />
          </div>
          <div className="th-navbar__group th-d-none th-d-tablet-flex">
            <div className="th-navbar__text">+7 (980) 452-40-12</div>
            <div className="th-navbar__gap" />
            <div className="th-navbar__button-container">
              <Button.Regular variant={variant2}>Подобрать тур</Button.Regular>
            </div>
            <div className="th-navbar__gap" />
            <div className="th-navbar__group th-d-desktop-none">
              <Button.Circular variant={variant2} icon="Search" responsive />
            </div>
          </div>
          <div className="th-navbar__gap" />
          <Button.Text variant={variant1} icon="Person" responsive />
          <div className="th-navbar__gap" />
          <Button.Circular variant={variant2} icon="More" responsive />
        </div>
      </div>
    </div>
    </div>
  );
}

function Carousel() {
  let [active, setActive] = useState(0);
  const images = [
    { url: '/static/image1.jpg', type: 'Фитнес', heading: 'Байдарки', price: '35 000' },
    { url: '/static/image2.jpg', type: 'Походы', heading: 'Горные туры', price: '43 000' },
    { url: '/static/image2.jpg', type: 'Походы', heading: 'Горные туры', price: '43 000' },
    { url: '/static/image3.jpg', type: 'Экстрим', heading: 'Джип-туры', price: '20 000' },
    { url: '/static/image1.jpg', type: 'Фитнес', heading: 'Байдарки', price: '35 000' },
    { url: '/static/image2.jpg', type: 'Походы', heading: 'Горные туры', price: '43 000' },
    { url: '/static/image2.jpg', type: 'Походы', heading: 'Горные туры', price: '43 000' },
    { url: '/static/image3.jpg', type: 'Экстрим', heading: 'Джип-туры', price: '20 000' },
    { url: '/static/image1.jpg', type: 'Фитнес', heading: 'Байдарки', price: '35 000' },
    { url: '/static/image2.jpg', type: 'Походы', heading: 'Горные туры', price: '43 000' },
    { url: '/static/image2.jpg', type: 'Походы', heading: 'Горные туры', price: '43 000' },
    { url: '/static/image3.jpg', type: 'Экстрим', heading: 'Джип-туры', price: '20 000' },
  ];

  function changeActive(delta) {
    setActive((active + delta + images.length) % images.length);
  }
  const images4 = [];
  for (const i of [0, 1, 2, 3]) {
    images4.push(images[i]);
  }
  return (
    <div className="th-carousel">
      <div className="th-carousel__heading">Подборки туров</div>
      <div className="th-carousel__subheading">
        Более
        {" "}
        <span className="th-carousel__tour-count">100+</span>
        {" "}
        путешествий
      </div>
      <div className="th-carousel__mobile th-d-tablet-none">
        <div className="th-carousel__mobile-inner">
          {images.map((image, i) => (
            <a key={i + 1}
              href="#"
              onClick={e => e.preventDefault()}
              className={classd`th-carousel__card`}
              style={{backgroundImage: `url("${image.url}")`}}
            >
              {/*<img className="th-carousel__image" src={} alt={"carousel_image_" + i} />*/}
              <div className="th-carousel__overlay">
                <div className="th-carousel__divider" />
                <div className="th-carousel__type">Походы</div>
                <div className="th-carousel__card-heading">{image.heading}</div>
                <div className="th-carousel__price">от {image.price} ₽</div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <div className="th-carousel__wrapper th-d-none th-d-tablet-grid">
      	<div className="th-carousel__button">
					<Button.Circular variant="gray-bordered" icon="ChevronLeft" action={() => {
						changeActive(-1);
					}} />
      	</div>
      	<div className="th-carousel__gallery">
          {images4.map((image, i) => (
            <a key={i + 1}
              href="#"
              onClick={e => e.preventDefault()}
              className={classd`th-carousel__card`}
              style={{backgroundImage: `url("${image.url}")`}}
              className={classd`th-carousel__card ${{"th--big": i === 1 || i === 2}}`}
            >
              <div className="th-carousel__overlay">
                <div className="th-carousel__divider"></div>
                <div className="th-carousel__type">Походы</div>
                <div className="th-carousel__card-heading">{image.heading}</div>
                <div className="th-carousel__price">от {image.price} ₽</div>
              </div>
            </a>
          ))}
        </div>
      	<div className="th-carousel__button">
					<Button.Circular variant="gray-bordered" icon="ChevronRight" action={() => {
						changeActive(1);
					}} />
      	</div>
      </div>
      <div className="th-carousel__indicator">
        <div className="th-carousel__indicator-mark" />
      </div>
    </div>
  );
}

/*


    <Layout.Inner>
      <Navbar layout="inner" />
    </Layout.Inner>
    <Layout.Outer>
      <Navbar layout="outer" />
    </Layout.Outer>

*/

export default function HomePage (props) {
  console.log("homepage props", props)
  const { selections, search_form, thesis_on_main } = props;
  return (<>
    <Layout.Hero>
      <div className="th-hero">
        <div className="th-hero__bg">
          <Navbar layout="hero" />
          <div className="th-hero__content">
            <div className="th-hero__left-col">
              <Button.Circular variant="light" icon="SocialTelegramTransparent" />
              <Button.Circular variant="light" icon="SocialVKTransparent" />
              <Button.Circular variant="light" icon="SocialFacebookTransparent" />
              <Button.Circular variant="light" icon="SocialInstagramTransparent" />
              <Button.Circular variant="light" icon="SocialWhatsAppTransparent" />
            </div>
            <div className="th-hero__center">
              <div className="th-hero__slogan">Мечтай и Путешествуй</div>
              <div className="th-hero__heading">
                {/*<span className="th-hero__heading-part">Вместе </span>
                <span className="th-hero__heading-part">с TRIP HOUSE</span>*/}
                Вместе с TRIP HOUSE
              </div>
              <div className="th-hero__form-heading">Поиск тура</div>
              <div className="th-hero__form-wrapper">

                <TourSearchForm search_form={search_form} />
              </div>

                <a href="#" onClick={e => e.preventDefault()} className="th-hero__scroll">
                  <p className="th-hero__scroll-text">листай вниз</p>
                  <div className="th-hero__scroll-circle" />
                </a>
            </div>
            <div className="th-hero__right-col">
              <Button.Circular variant="light" icon="Search" />
            </div>
          </div>
          {/* */}
        </div>
        <Carousel />
      </div>

      <div className="th-advantages">
        <div className="th-advantages__slogan">Преимущества</div>
        <div className="th-advantages__heading">Почему именно мы</div>
        <div className="th-advantages__wrapper">
          {thesis_on_main?.map(({id, name1, name2, text}, i) => {
            const Adv = elements[`Advantage${i + 1}`];
            return (<div className="th-advantages__card">
              <Adv />
              <div className="th-advantages__card-heading">
                <span className="th-advantages__card-heading__first-line">{name1}</span>
                {" "}
                <span className="th-advantages__card-heading__second-line">{name2}</span>
              </div>
              <div className="th-advantages__text">
                {/* <b>Trip House</b> - это незабываемые впечатления и гарантированный заряд положительных эмоций. */}
                {text}
              </div>
            </div>);
          })}
      </div>
    </div>
    <Footer {...props} />
    </Layout.Hero>
  </>);
};
