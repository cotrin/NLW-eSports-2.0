import express from 'express'
import cors from 'cors'


import { PrismaClient } from '@prisma/client'
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes'
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string'

import { loginRoutes } from './login.routes'

const app = express()
app.use(express.json())
app.use(cors())

const prisma = new PrismaClient()


app.use(loginRoutes)

app.get('/games', async (req,res) => {
  const games = await prisma.game.findMany({
    include: {
      _count:{
        select: {
          ads: true
        }
      }
    }
  })

  return res.json(games)
})

app.post('/games/:id/ads', async (req,res) => {
  const gameId =  req.params.id
  const { body } = req

  // ToDo validation of body to remove type any - Zod JS Lib

  const ad = await prisma.add.create({
    
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(','),
      hourStart: convertHourStringToMinutes(body.hourStart),
      hourEnd: convertHourStringToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    }
  })

  return res.status(201).json(ad)
})

app.get('/games/:title/ads', async (req, res) => {
  const gameTitle = req.params.title

  const ads = await prisma.add.findMany({
    select: {
      game: true,
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel:true,
      yearsPlaying:  true,
      hourStart: true,
      hourEnd: true

    },
    where: {
      game: {
        title: gameTitle
      }
    },
    orderBy: {
      createdAt: 'desc'
    }    
   
  })

  return res.json(ads.map(ad => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      hourStart: convertMinutesToHourString(ad.hourStart),
      hourEnd: convertMinutesToHourString(ad.hourEnd)
    }
  }))
})

app.get('/ads/:id/discord', async (req, res) => {
  const adId = req.params.id

  const ad = await prisma.add.findUniqueOrThrow({
    select: {
      discord: true
    },
    where: {
      id: adId
    }
  })

  return res.json({
    discord: ad.discord
  })
})

app.listen(3333, () => console.log('server is running'))


