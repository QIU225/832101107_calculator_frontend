Page({
  data: {
    result: '0',
    history: [],
    valiBackOfArray: [
      '+',
      '-',
      '×',
      '÷',
      '.',
      '√',
      '^',
      'log',
      'sci',
      'cos',
      'sin',
      'tan',
      'ln',
      'sci',
      '%',
      '(',
      ')',
    ],
    completeCalculate: false,
    openedParentheses: 0,
    hadleFlag:false,
    ansIndex:0
  },

  calculate: function (str) {
    const precedence = {
      '+': 1,
      '-': 1,
      '×': 2,
      '÷': 2,
      '%': 2,
      '^': 3,
      '√': 4,
      log: 4,
      sin: 4,
      cos: 4,
      tan: 4,
      ln:4,
      sci:4
    }

    const operators = []
    const operands = []
    const tokens = str.split(/([+\-×÷^()√%])/)
    console.log(tokens);
    tokens.forEach((token) => {
      if (token != '') {
        if (
          token in precedence ||
          token === '√' ||
          token === 'log' ||
          token === 'sin' ||
          token === 'cos' ||
          token === 'tan' ||
          token === 'ln' ||
          token === '%'
        ) {
          while (
            operators.length > 0 &&
            precedence[operators[operators.length - 1]] >= precedence[token] &&
            operators[operators.length - 1] !== '('
          ) {
            console.log(operators);
            const operator = operators.pop()
            const b = operands.pop()
            const a = operands.pop()
            operands.push(this.performOperation(a, b, operator))
          }
          console.log(token);
          operators.push(token)
        } else if (token === '(') {
          operators.push(token)
        } else if (token === ')') {
          console.log(operators);
          while (
            operators.length > 0 &&
            operators[operators.length - 1] !== '('
          ) {
            console.log(operators);
            const operator = operators.pop()
            const b = operands.pop()
            const a = operands.pop()
            operands.push(this.performOperation(a, b, operator))
          }
          if (operators.length > 0 && operators[operators.length - 1] === '(') {
            operators.pop()
          }
        } else {
          if (token.toLowerCase() === 'sci') {
            // 处理科学计数法
            const coefficient = parseFloat(operands.pop())
            const exponent = parseFloat(operands.pop())
            const result = coefficient * Math.pow(10, exponent)
            operands.push(result)
          } else {
            operands.push(parseFloat(token))
          }
        }
      }
    })
    while (operators.length > 0) {
      const operator = operators.pop()
      if (operator == 'sci') {
        const coefficient = parseFloat(operands.pop())
        const p = Math.floor(Math.log(coefficient) / Math.LN10);
        const n = coefficient * (10 ** -p);
        operands.push(`${n}e${p}`)
      }else{
        const b = operands.pop()
        let a = null
        console.log(operator);
        if (operator  != 'log' && operator  != 'sin' && operator  != 'cos'&& operator  != 'tan' && operator != 'ln') {
          a = operands.pop() 
        }
        operands.push(this.performOperation(a, b, operator))
      }
    }
    return operands[0].toString()
  },

  op: function (event) {
    const operator = event.currentTarget.dataset.op
    if(operator == 'ANS'){
      /**
       * 查看结果
       */
      if (!this.hadleFlag) {
        this.hadleFlag = true
        var that=this;
        wx.request({
          url: 'http://localhost:8088/calculator/getData', 
          method:'POST',
          data: {
            index: that.ansIndex
          },
          header: {
            'content-type': 'application/json' 
          },
          success (res) {
            that.hadleFlag = false
            if (that.ansIndex < 9) {
              that.ansIndex++ 
            }else{
              that.ansIndex = 0
            }
            if (res.data.message != null) {
              that.setData({
                result: res.data.message,
                completeCalculate: true,
              })
            }
          }
        }) 
      }
    }else if (!this.isOperatorEnd(this.data.result)) {
      if (this.data.result == 0) {
        this.setData({
          result: operator,
          completeCalculate: false,
        }) 
      }else{
        this.setData({
          result: this.data.result + operator,
          completeCalculate: false,
        })
      }
    }
  },

  performOperation: function (a, b, operator) {
    console.log(a,b,operator);
    switch (operator) {
      case '+':
        return parseFloat(a) + parseFloat(b)
      case '-':
        return parseFloat(a) - parseFloat(b)
      case '×':
        return parseFloat(a) * parseFloat(b)
      case '÷':
        return parseFloat(a) / parseFloat(b)
      case '%':
        return parseFloat(a) % parseFloat(b)
      case '^':
        return Math.pow(parseFloat(a), parseFloat(b))
      case '√':
        return Math.pow(parseFloat(b), 0.5)
      case 'sin':
        return Math.sin(parseFloat(b) * (Math.PI / 180))
      case 'cos':
        return Math.cos(parseFloat(b) * (Math.PI / 180))
      case 'tan':
        return Math.tan(parseFloat(b) * (Math.PI / 180))
      case 'log':
        return Math.log10(parseFloat(b))
      case 'ln':
        return Math.log(parseFloat(b))
      default:
        return 0
    }
  },

  isOperatorEnd: function (str) {
    if (typeof str !== 'string' || str.length === 0) {
      return false
    }
    const lastChar = str.charAt(str.length - 1)
    return false
  },

  numBtn: function (event) {
    const num = event.currentTarget.dataset.num
    if (this.data.completeCalculate) {
      this.setData({
        result: num,
        completeCalculate: false,
      })
    } else {
      if (this.data.result === '0' || this.data.result === 'Error: ') {
        this.setData({
          result: num,
        })
      } else {
        this.setData({
          result: this.data.result +''+ num,
        })
      }
    }
  },

  dot: function () {
    if (!this.data.result.includes('.') && !this.data.completeCalculate) {
      this.setData({
        result: this.data.result + '.',
      })
    }
  },

  cal: function () {
    if (!this.isOperatorEnd(this.data.result)) {
      const result = this.data.result
      try {
        const calculatedResult = this.calculate(result).toString()
        if (!this.hadleFlag) {
          this.hadleFlag = true
          var that=this;
          wx.request({
            url: 'http://localhost:8088/calculator/insertData', 
            method:'POST',
            data: {
              formula: result,
              answer: calculatedResult
            },
            header: {
              'content-type': 'application/json' 
            },
            success (res) {
              that.hadleFlag = false
              console.log(res.data)
            }
          }) 
        }

        this.setData({
          result: calculatedResult,
          completeCalculate: true,
          lastResult: calculatedResult,
        })
        this.data.history.push({ expression: result, result: calculatedResult })
        if (this.data.history.length > 10) {
          this.data.history.shift()
        }
        this.setData({ history: this.data.history })
      } catch (error) {
        this.setData({
          result: 'Error: ' + error.message,
          completeCalculate: true,
        })
      }
    }
  },

  clear: function () {
    this.setData({
      result: '0',
      completeCalculate: false,
      openedParentheses: 0,
      closedParentheses: 0,
    })
    this.ansIndex = 0
  },

  del: function () {
    if (this.data.result.length > 1) {
      this.setData({
        result: this.data.result.slice(0, -1),
      })
    } else {
      this.setData({
        result: '0',
      })
    }
  },
})