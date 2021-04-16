module.exports = {
  "commitHash": "f0d13e8e10f5e5796a07f50fc962486c4d1f2f02",
  "previousCommitHash": "071921f83d8310bd2b026501091a089735908b32",
  "nextCommitHash": "cae2cb19993a5c9e59f380fd38744c61b6fbc083",
  "classes": [
    {
      "methods": [
        {
          "methodName": "sendAsyncUDPQuery(to:port:timeout:completion:)",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "query(ip:port:version:timeout:numberOfSamples:completion:)"
                }
              ],
              "totalCallAmount": "1",
              "callerClassName": "NTPClient"
            }
          ],
          "totalCallAmount": "1"
        },
        {
          "methodName": "offset(from:)",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "query(pool:version:port:numberOfSamples:maximumServers:timeout:progress:)"
                }
              ],
              "totalCallAmount": "1",
              "callerClassName": "NTPClient"
            }
          ],
          "totalCallAmount": "1"
        },
        {
          "methodName": "query(pool:version:port:numberOfSamples:maximumServers:timeout:progress:)",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "sync(from:samples:first:completion:)"
                }
              ],
              "totalCallAmount": "1",
              "callerClassName": "Clock"
            }
          ],
          "totalCallAmount": "1"
        },
        {
          "methodName": "query(ip:port:version:timeout:numberOfSamples:completion:)",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "query(pool:version:port:numberOfSamples:maximumServers:timeout:progress:)"
                },
                {
                  "number_of_calls": "1",
                  "callerMethodName": "query(ip:port:version:timeout:numberOfSamples:completion:)"
                }
              ],
              "totalCallAmount": "2",
              "callerClassName": "NTPClient"
            }
          ],
          "totalCallAmount": "2"
        }
      ],
      "className": "NTPClient",
      "totalCallAmount": "5"
    },
    {
      "methods": [
        {
          "methodName": "onTimeout()",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "resolve(host:timeout:completion:)"
                }
              ],
              "totalCallAmount": "1",
              "callerClassName": "DNSResolver"
            }
          ],
          "totalCallAmount": "1"
        },
        {
          "methodName": "resolve(host:timeout:completion:)",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "query(pool:version:port:numberOfSamples:maximumServers:timeout:progress:)"
                }
              ],
              "totalCallAmount": "1",
              "callerClassName": "NTPClient"
            }
          ],
          "totalCallAmount": "1"
        }
      ],
      "className": "DNSResolver",
      "totalCallAmount": "2"
    },
    {
      "methods": [
        {
          "methodName": "scheduledTimer(withTimeInterval:repeated:handler:)",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "query(ip:port:version:timeout:numberOfSamples:completion:)"
                }
              ],
              "totalCallAmount": "1",
              "callerClassName": "NTPClient"
            }
          ],
          "totalCallAmount": "1"
        },
        {
          "methodName": "invokeFrom(timer:)",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "scheduledTimer(withTimeInterval:repeated:handler:)"
                }
              ],
              "totalCallAmount": "1",
              "callerClassName": "BlockTimer"
            }
          ],
          "totalCallAmount": "1"
        }
      ],
      "className": "BlockTimer",
      "totalCallAmount": "2"
    },
    {
      "methods": [
        {
          "methodName": "drawClock(hour:minute:second:title:x:)",
          "callers": [],
          "totalCallAmount": "0"
        },
        {
          "methodName": "tick()",
          "callers": [],
          "totalCallAmount": "0"
        },
        {
          "methodName": "printDigit(digit:y:x:)",
          "callers": [],
          "totalCallAmount": "0"
        },
        {
          "methodName": "start()",
          "callers": [],
          "totalCallAmount": "0"
        },
        {
          "methodName": "loop()",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "start()"
                }
              ],
              "totalCallAmount": "1",
              "callerClassName": "ASCIIClock"
            }
          ],
          "totalCallAmount": "1"
        }
      ],
      "className": "ASCIIClock",
      "totalCallAmount": "1"
    },
    {
      "methods": [
        {
          "methodName": "mvprintw(y:_:_:)",
          "callers": [],
          "totalCallAmount": "0"
        },
        {
          "methodName": "clear(x:y:width:height:)",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "drawClock(hour:minute:second:title:x:)"
                }
              ],
              "totalCallAmount": "1",
              "callerClassName": "ASCIIClock"
            }
          ],
          "totalCallAmount": "1"
        }
      ],
      "className": "Curses",
      "totalCallAmount": "1"
    },
    {
      "methods": [
        {
          "methodName": "sync(from:samples:first:completion:)",
          "callers": [],
          "totalCallAmount": "0"
        },
        {
          "methodName": "loadFromDefaults()",
          "callers": [],
          "totalCallAmount": "0"
        },
        {
          "methodName": "reset()",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "sync(from:samples:first:completion:)"
                }
              ],
              "totalCallAmount": "1",
              "callerClassName": "Clock"
            }
          ],
          "totalCallAmount": "1"
        }
      ],
      "className": "Clock",
      "totalCallAmount": "1"
    },
    {
      "methods": [
        {
          "methodName": "dateFromNTPFormat(_:)",
          "callers": [],
          "totalCallAmount": "0"
        },
        {
          "methodName": "intervalFromNTPFormat(_:)",
          "callers": [],
          "totalCallAmount": "0"
        },
        {
          "methodName": "prepareToSend(transmitTime:)",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "sendAsyncUDPQuery(to:port:timeout:completion:)"
                }
              ],
              "totalCallAmount": "1",
              "callerClassName": "NTPClient"
            }
          ],
          "totalCallAmount": "1"
        },
        {
          "methodName": "isValidResponse()",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "1",
                  "callerMethodName": "query(ip:port:version:timeout:numberOfSamples:completion:)"
                }
              ],
              "totalCallAmount": "1",
              "callerClassName": "NTPClient"
            }
          ],
          "totalCallAmount": "1"
        },
        {
          "methodName": "intervalToNTPFormat(_:)",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "2",
                  "callerMethodName": "prepareToSend(transmitTime:)"
                }
              ],
              "totalCallAmount": "2",
              "callerClassName": "NTPPacket"
            }
          ],
          "totalCallAmount": "2"
        },
        {
          "methodName": "dateToNTPFormat(_:)",
          "callers": [
            {
              "callerMethods": [
                {
                  "number_of_calls": "4",
                  "callerMethodName": "prepareToSend(transmitTime:)"
                }
              ],
              "totalCallAmount": "4",
              "callerClassName": "NTPPacket"
            }
          ],
          "totalCallAmount": "4"
        }
      ],
      "className": "NTPPacket",
      "totalCallAmount": "8"
    },
    {
      "methods": [
        {
          "methodName": "systemUptime()",
          "callers": [],
          "totalCallAmount": "0"
        },
        {
          "methodName": "toDictionary()",
          "callers": [],
          "totalCallAmount": "0"
        }
      ],
      "className": "TimeFreeze",
      "totalCallAmount": "0"
    }
  ]
}
