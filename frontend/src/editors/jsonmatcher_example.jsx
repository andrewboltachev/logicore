export default {
  value: {
    contents: {
      fields: {
        contents: {
          contents: {
            contents: [{
              contents: {
                contents: {
                  k: {
                    contents: {
                      contents: 'name',
                      tag: 'MatchStringExact'
                    },
                    tag: 'KeyReq'
                  },
                  label: {
                    contents: {
                      contents: 'Name',
                      tag: 'MatchStringExact'
                    },
                    tag: 'KeyReq'
                  },
                  required: {
                    contents: {
                      contents: true,
                      tag: 'MatchBoolExact'
                    },
                    tag: 'KeyReq'
                  },
                  type: {
                    contents: {
                      contents: 'TextField',
                      tag: 'MatchStringExact'
                    },
                    tag: 'KeyReq'
                  }
                },
                tag: 'MatchObjectFull'
              },
              tag: 'Char'
            },
            {
              contents: {
                contents: {
                  addWhat: {
                    contents: {
                      contents: 'item',
                      tag: 'MatchStringExact'
                    },
                    tag: 'KeyReq'
                  },
                  fields: {
                    contents: {
                      contents: {
                        contents: [{
                          contents: {
                            contents: {
                              k: {
                                contents: {
                                  contents: 'name',
                                  tag: 'MatchStringExact'
                                },
                                tag: 'KeyReq'
                              },
                              label: {
                                contents: {
                                  contents: 'Item Name',
                                  tag: 'MatchStringExact'
                                },
                                tag: 'KeyReq'
                              },
                              required: {
                                contents: {
                                  contents: true,
                                  tag: 'MatchBoolExact'
                                },
                                tag: 'KeyReq'
                              },
                              type: {
                                contents: {
                                  contents: 'TextField',
                                  tag: 'MatchStringExact'
                                },
                                tag: 'KeyReq'
                              }
                            },
                            tag: 'MatchObjectFull'
                          },
                          tag: 'Char'
                        },
                        {
                          contents: {
                            contents: {
                              k: {
                                contents: {
                                  contents: 'count',
                                  tag: 'MatchStringExact'
                                },
                                tag: 'KeyReq'
                              },
                              label: {
                                contents: {
                                  contents: 'Count',
                                  tag: 'MatchStringExact'
                                },
                                tag: 'KeyReq'
                              },
                              type: {
                                contents: {
                                  contents: 'NumberField',
                                  tag: 'MatchStringExact'
                                },
                                tag: 'KeyReq'
                              }
                            },
                            tag: 'MatchObjectFull'
                          },
                          tag: 'Char'
                        }],
                        tag: 'Seq'
                      },
                      tag: 'MatchArrayContextFree'
                    },
                    tag: 'KeyReq'
                  },
                  k: {
                    contents: {
                      contents: 'items',
                      tag: 'MatchStringExact'
                    },
                    tag: 'KeyReq'
                  },
                  layout: {
                    contents: {
                      contents: 'WithDeleteButton',
                      tag: 'MatchStringExact'
                    },
                    tag: 'KeyReq'
                  },
                  type: {
                    contents: {
                      contents: 'UUIDListField',
                      tag: 'MatchStringExact'
                    },
                    tag: 'KeyReq'
                  }
                },
                tag: 'MatchObjectFull'
              },
              tag: 'Char'
            }],
            tag: 'Seq'
          },
          tag: 'MatchArrayContextFree'
        },
        tag: 'KeyReq'
      },
      type: {
        contents: {
          contents: 'Fields',
          tag: 'MatchStringExact'
        },
        tag: 'KeyReq'
      }
    },
    tag: 'MatchObjectFull'
  }
}
