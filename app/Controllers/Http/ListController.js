'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Database = use('Database')

/**
 * Resourceful controller for interacting with lists
 */
class ListController 
{
  /**
   * Show a list of all lists.
   * GET lists
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async getAll ({ request, response }) 
  {
    const getItemsWeighings = (items) => items.map((item) => item.weighing)
    const calculateWeighing = (itemWeighing) => itemWeighing / 1000 
    const calculatePrice = (itemsDifference, itemPrice) => itemsDifference * itemPrice
    const calculateDifference = (itemsweighingMax, itemWeighing) => itemsweighingMax / itemWeighing
    const convertWeighing = (item) => (item.weight != 'kg' && item.weight != 'L') ? calculateWeighing(item.weighing) : item.weighing
    const convertWeighingToOriginal = (item) => (item.weight != 'kg' && item.weight != 'L') ? item.weighing * 1000 :  item.weighing

    let items = await Database.raw('select distinct lists.id as id, markets.name as market, markets.id as marketID, products.name as product, products.id as productID, amount, price, weighing, weight from lists, markets, products where lists.product = products.id and lists.market = markets.id')
    items[0].map((obj) => obj.weighing = convertWeighing(obj))

    let itemsByProduct = items[0].map((obj) => obj.product)
    itemsByProduct = Array.from(new Set(itemsByProduct))

    let result = []

    for (let product of itemsByProduct) 
    {
        product = items[0].filter((obj) => obj.product == product)

        const weighingMax = Math.max(...getItemsWeighings(product))
        const productWeighingMax = product.filter((obj) => obj.weighing == weighingMax)
      
        product.map((obj, index) => {
          let differenceWeighing = calculateDifference(weighingMax, obj.weighing)
          let differencePrice = calculatePrice(differenceWeighing, obj.price)

          if(obj.weight == 'kg' || obj.weight == 'L')
          {
              differenceWeighing = weighingMax - obj.weighing

              if(differenceWeighing != 0)
              {
                  differencePrice = calculatePrice(differenceWeighing, obj.price) + obj.price
              }
              else
              {
                  differencePrice = productWeighingMax[0].price - obj.price
              }
          }
          else
          {
              differencePrice = differencePrice - obj.price
          }
          
          product[index].difference = parseFloat(differencePrice).toFixed(2)
          product[index].weighing = convertWeighingToOriginal(obj)
        })  

        result.push(product)
    }

    response.send(items)
  }

  /**
   * Display a single list.
   * GET list/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async get ({ params, request, response }) 
  {
    response.send(await Database.select('*').from('lists').where(params))
  }

  /**
   * Create/save a new list.
   * POST list
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async post ({ request, response }) 
  {
    response.send(await Database.table('lists').insert(request.body))
  }

  /**
   * Update lists details.
   * PUT or PATCH list/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async put ({ params, request, response }) 
  {
    response.send(await Database.table('lists').where(params).update(request.body))
  }

  /**
   * Delete a list with id.
   * DELETE lists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async delete ({ params, request, response }) 
  {
    response.send(await Database.table('lists').where(params).delete())
  }

  /**
   * Delete all items of list.
   * DELETE lists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async deleteAll ({ params, request, response }) 
  {
    response.send(await Database.table('lists').delete())
  }
}

module.exports = ListController
