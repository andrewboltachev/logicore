import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useMemo,
  useRef,
  useContext
} from 'react'
import {
  useLocalStorage,
  useApi,
  moveUp,
  moveDown,
  range,
  capitalize,
  partition2,
  orderBy,
  getURLParameterByName,
  useWindowSize,
  useDebounce,
  changeURLParameter
} from '../utils'
import classd from 'classd'
import * as Layout from '../components/layouts'
import * as Input from '../components/inputs'
import Footer from '../components/footer'

import { Logo, Menu, Person, Advantage1, Advantage2, Advantage3, Advantage4, FooterLogo, Rect1, Rect2, Rect3, Telegram, Vk, Facebook, Instagram, Whatsapp, TelegramNav, WhatsappNav, InstagramNav, FacebookNav, StarNav, BreadHome, Suitcase, Signal, Wifi, Electricity, Quote } from '../elements'
import * as elements from '../elements'

import * as Button from '../components/buttons'

import TourSearchForm, { searchFormToUrlParts } from '../components/tour-search-form'
import { RawGenericForm, FormComponent } from '../framework'
import Stars, { Dots } from '../components/stars'
import { Navbar } from '../pages/home'
import * as Icon from '../components/icons'
import { LabeledWidget, GridPair } from '../components/elements'
import _ from 'lodash'

const SorterWidget = ({ sorter, sortBy }) => {
  const hist = useHistory()
  if (!sorter) return null
  return (
    <FormComponent
      definition={{
        type: 'Fields',
        fields: [
          {
            k: 'sorting',
            type: 'SelectField',
            label: 'Сортировка',
            placeholder: '---',
            options: sorter,
            required: false
          }
        ]
      }}
      value={{
        sorting: sorter.find(({ value }) => value === sortBy)
      }}
      onChange={(v) =>
        hist.push(
          window.location.pathname +
        '?' +
        changeURLParameter('sortBy', v.sorting?.value)
        )}
      error={{}}
      onReset={() => { }}
      path={[]}
      context={{
        labelPlacement: 'micro',
        selectWidth: 300
      }}
    />
  )
}

/*

    <Layout.Inner>
      <Navbar layout="inner" />
    </Layout.Inner>
    <Layout.Outer>
      <Navbar layout="outer" />
    </Layout.Outer>

*/

const TourItem = ({ tour, isGrid }) => {
  const min_age = <>Мин. возраст: {tour.min_age}</>
  const rating = (
    <Stars
      label='Оценка'
    // MAX_LEVEL={1}
    // value={0}
    // color="warning"
    />
  )
  const review_count = <>Отзывы: 0</>
  const price = <h4>{tour.price}</h4>
  const days_length = (
    <small>
      {tour.days_length}
    </small>
  )
  const start_dates = (
    <span className='mb-3 fs-11'>{tour.start_dates}</span>
  )
  const TourLink = ({ children }) => (
    <Link
      className={classd`btn btn-primary ${{
        'btn-sm': isGrid
      }}`}
      to={`/tour/${tour.id}`}
    >
      {children}
    </Link>
  )
  const tourComplexity = (
    <div className='th-text'>
      Степень сложности:
      {' \u00a0'}
      <Dots MAX_LEVEL={5} value={tour.complexity_level_id} />
    </div>
  )
  const tourMinAge = (
    <div className='th-text'>Мин. возраст: {tour.min_age}</div>
  )
  const tourReviews = (
    <div className='th-text'>
      Отзывы: 0
      {/* <Button.Text variant="intense">Смотреть отзывы</Button.Text> */}
      {' \u00a0 '}
      <a href='#' onClick={e => e.preventDefault()}>Смотреть отзывы</a>
    </div>
  )
  const tourRating = (
    <div className='th-text'>
      Оценка:
      {' \u00a0 '}
      <div className='th-d-inline'>
        <span style={{ color: 'var(--th-color-primary)', position: 'relative', top: -2 }}><Icon.Star variant='intense' /></span>
        4.9
      </div>
    </div>
  )
  return (
    <div className='th-tours__grid-item'>
      <div
        className='th-tours__grid-photo' style={{
          backgroundImage: `url('/media/${tour.image}'), linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.12) 110.38%)`
        }}
      >
        <div className='th-tours__grid-photo-star'>
          <Button.Circular className='th-d-desktop-none' variant='light' icon='Star' />
        </div>
        <div className='th-tours__grid-photo-inner'>
          <div className='d-flex justify-content-between align-items-end'>
            <div>
              <div className='th-carousel__divider' />
              <div className='th-tour-type'>Фитнес</div>
            </div>
            <div className='th-tours__grid-photo-rating th-d-desktop-none'>
              <Icon.Star variant='light-intense' />
              4.9
            </div>
            <div className='th-tours__grid-photo-rating th-di-none th-di-desktop-grid'>
              <Button.Circular variant='light' icon='Star' />
            </div>
          </div>
        </div>
      </div>
      <div className='th-tours__grid-content'>
        <div className='th-tours__grid-content-1'>
          <div className='th-tour-heading'>{tour.name}</div>
          <div className='th-text th-tour__m1'>
            <ul>
              {tour.feature?.map((f, ii) => (
                <li key={ii}>{_.trimStart(f, '-–– ')}</li>
              ))}
            </ul>
          </div>
          <div className='th-d-desktop-none'>
            <Button.Text variant='intense' className='th-collapse-button th-di-mobile-none th-di-tablet-grid th-di-desktop-none'>
              Развернуть
              <Icon.ChevronDown variant='intense' />
            </Button.Text>
            <div className='th-tour__m2'>
              {tourComplexity}
              {tourMinAge}
              {tourReviews}
            </div>
            <div className='th-text th-tour__m3'>{tour.start_dates || '01.08.2022 - 14.08.2022'}</div>
            <div className='th-tour-price th-tour__m4'>
              {/* tour.price */ '35 000  ₽'}
              {' \u00a0 '}
              <div className='th-text'>{tour.days_length}</div>
            </div>
            <Button.Text variant='intense' className='th-collapse-button th-di-tablet-none'>
              Развернуть
              <Icon.ChevronDown variant='intense' />
            </Button.Text>
            <Button.Regular variant='regular' className='th-tour-go-button'>
              Подробнее о туре
            </Button.Regular>
          </div>
          <div className='th-d-none th-d-desktop-flex th-tour-m5-wrapper'>
            <div className='th-tour-m5'>
              {tourComplexity}
              {tourMinAge}
              {tourReviews}
              {tourRating}
            </div>
          </div>
        </div>
        <div className='th-tours__grid-content-2 th-di-none th-di-desktop-flex'>
          <div className='th-tours__grid-content-2-inner'>
            <div>
              <div className='th-tour-price'>
                {/* tour.price */ '35 000  ₽'}
                {' \u00a0 '}
              </div>
              <div className='th-text'>{tour.days_length}</div>
            </div>
            <div>
              <div className='th-text'>{tour.start_dates || '01.08.2022 - 14.08.2022'}</div>
              <Button.Regular variant='regular' className='th-tour-go-button'>
                Подробнее о туре
              </Button.Regular>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CatalogPage (props) {
  const { tours, search_form, sorter, sortBy, title, selection, global_search } = props
  const presentationOptions = [
    {
      k: 'list',
      label: 'Список',
      icon: <i className='fa fa-bars' />
    },
    {
      k: 'grid',
      label: 'Плитка',
      icon: <i className='fa fa-th' />
    }
  ]
  const [presentation, setPresentation] = useLocalStorage(
    'TRIPHOUSE_TOUR_LIST_PRESENTATION',
    'list'
  )
  const [state1, setState1] = useState({})
  const hist = useHistory()
  const isGrid = presentation === 'grid'
  const urlParams = new URLSearchParams(window.location.search)
  urlParams.delete('selection')
  const linkWithoutExtraSelected = `${window.location.pathname}?${urlParams.toString()}`
  console.log('linkWithoutExtraSelected', linkWithoutExtraSelected)
  return (
    <>
      <Layout.Outer>
        <Navbar layout='outer' />
        <div className='th-breadcrumbs'>
          <div className='th-breadcrumbs__inner'>
            <Icon.Home variant='regular' />
            <a href='#' onClick={e => e.preventDefault()} className='th-breadcrumbs__item th--muted'>Главная</a>
            <span className='th-breadcrumbs__sep' />
            <a href='#' onClick={e => e.preventDefault()} className='th-breadcrumbs__item th--muted'>Каталог путешествий</a>
            <span className='th-breadcrumbs__sep' />
            <a href='#' onClick={e => e.preventDefault()} className='th-breadcrumbs__item'>Горные туры</a>
          </div>
        </div>
        <div className='th-content'>
          <div className='th-catalog'>
            <div className='th-catalog__left'>
              <TourSearchForm isColumn search_form={search_form} />
            </div>
            <div className='th-catalog__right'>
              <div className='th-catalog__top-row'>
                <GridPair>
                  <LabeledWidget label='Выбранные подборки'>
                    <div className='th-tag'>
                      Горные туры
                      <Button.Icon icon='Cross' />
                    </div>
                  </LabeledWidget>
                  <RawGenericForm
                    value={state1}
                    onChange={setState1}
                    definition={{
                      type: 'Fields',
                      fields: [
                        { type: 'SelectField', k: 'name', label: 'Подборки' }
                      ],
                      context: {
                        select_custom_styles: 'SelectionFilter',
                        variant: 'selectionForm',
                        labelPlacement: 'placeholder'
                      }
                    }}
                  />
                </GridPair>
              </div>
              <div className='th-heading-row'>
                <div className='th-heading-row__left'>
                  <div className='th-tours-heading'>Наши туры</div>
                  <div className='th-tours-found'>
                    Найдено
                    {' '}<span className='th-tours-found__inner'>24</span>{' '}
                    тура
                  </div>
                </div>
                <GridPair className='th-heading-row__right'>
                  <LabeledWidget label='Отображение'>
                    <div className='th-d-flex'>
                      <Button.Square icon='ViewRows' variant='pastell' />
                      <Button.Square icon='ViewGrid' variant='intense' />
                    </div>
                  </LabeledWidget>
                  <RawGenericForm
                    value={state1}
                    onChange={setState1}
                    definition={{
                      type: 'Fields',
                      fields: [
                        { type: 'SelectField', k: 'name', label: 'По популярности' }
                      ],
                      context: {
                        select_custom_styles: 'SelectionFilter',
                        variant: 'selectionForm',
                        labelPlacement: 'placeholder'
                      }
                    }}
                  />
                </GridPair>
              </div>
              <div className=''>
                {(selection || global_search) && <div className='row'>
                  <div className='col-md-12'>
                    <div className='mt-3'>{selection && <><strong>Отображается подборка:</strong> <span className='badge bg-warning mx-1 text-dark' style={{ fontSize: '1rem' }}>
                      <span style={{ position: 'relative', top: -1 }}>{selection.name} | <Link className='text-dark' to={linkWithoutExtraSelected}><i className='fa fa-times' /></Link></span>
                    </span>
                    </>}
                    </div>
                  </div>
                </div>}
              </div>
              <div className='th-tours__grid'>
                {tours?.map((tour) => (
                  <TourItem tour={tour} isGrid={isGrid} />
                ))}
              </div>
              {/* <div className="container-fluid">
            <div className="d-flex align-items-center justify-content-between">
              <h3 className="my-3">{title || 'Каталог путешествий'}</h3>
              <div className="d-flex justify-content-start align-items-center">
                Отображение:
                <div className="btn-group mx-1">
                  {presentationOptions.map(({ k, label, icon }) => (
                    <button
                      type="button"
                      key={k}
                      className={`btn btn-sm btn-${presentation === k ? "" : "outline-"
                        }secondary`}
                      onClick={(_) => setPresentation(k)}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0">
                <SorterWidget {...{ sorter, sortBy }} />
              </div>
            </div>
          </div>
          <div className="tour-list container-fluid">
            <div className="row">
              {tours?.map((tour) => {
                // const complexity = (
                //   <Stars
                //     label="Сложность"
                //     MAX_LEVEL={5}
                //     value={tour.complexity_level_id}
                //   />
                // );
                const min_age = <>Мин. возраст: {tour.min_age}</>;
                const rating = (
                  <Stars
                    label="Оценка"
                  // MAX_LEVEL={1}
                  // value={0}
                  // color="warning"
                  />
                );
                const review_count = <>Отзывы: 0</>;
                const price = <h4>{tour.price}</h4>;
                const days_length = (
                  <small>
                    {tour.days_length}
                  </small>
                );
                const start_dates = (
                  <span className="mb-3 fs-11">{tour.start_dates}</span>
                );
                const TourLink = ({ children }) => (
                  <Link
                    className={classd`btn btn-primary ${{
                      "btn-sm": isGrid,
                    }}`}
                    to={`/tour/${tour.id}`}
                  >
                    {children}
                  </Link>
                );
                return (
                  <>
                    {/* <Tabs /> * /}
                    <div className="col tour-list__tour" key={tour.id}>
                      <div className="row">
                        {tour.image && (
                          <div className="col image-content">
                            <div className="image" style={{
                              backgroundImage: `url('/media/${tour.image}'), linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.12) 110.38%)`
                            }}>
                              <div className="image-caption d-flex align-items-center">
                                <div className="caption">
                                  <div className="divider-x" />
                                  <span className="type">fitness</span>
                                </div>
                                <button className="btn rounded-circle select-tour-button" type="button">
                                  <i className="fa fa-star"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="col d-flex flex-column tour-content">
                          <h5 className="title">
                            <Link style={{ textDecoration: "none" }}
                              to={`/tour/${tour.id}`}
                            >{tour.name}</Link>
                          </h5>
                          <div className="flex-grow-1 card-info">
                            <ul>
                              {tour.feature?.map((f, ii) => (
                                <li key={ii}>{f}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="d-flex justify-content-between">
                            <div>
                              {/* <div className="card-text">{complexity}</div> * /}
                              <div>{min_age}</div>
                            </div>
                            <div className="tour-description">
                              <div>{rating}</div>
                              <div>
                                <span className="review-count">{review_count}</span>
                                <a className="primary-link" href="#review">Смотреть отзывы</a>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col divider-container">
                          <div className="divider-y"></div>
                        </div>

                        <div className="col d-flex tour-price flex-column">
                          <div className="flex-grow-1">
                            {price}
                            {days_length}
                          </div>
                          {start_dates}
                          <TourLink>Подробнее о туре</TourLink>
                        </div>
                      </div>
                    </div>
                    <div className="divider-x"></div>
                  </>
                );
              })}
            </div>
          </div> */}
            </div>
          </div>
        </div>
        <Footer {...props} />
      </Layout.Outer>
    </>
  )
};
