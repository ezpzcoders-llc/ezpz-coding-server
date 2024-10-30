import { Request, Response } from 'express'

import { db, Tables } from '../lib/db'
import clients from './clients'
import { handleGenericError } from '../utils/http'

const getAll = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { data, error } = await db.from(Tables.NEWSLETTER).select('*')
        if (error) throw error
        return res.status(200).json({ newsletter: data })
    } catch (err) {
        return handleGenericError(err, res)
    }
}

const add = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { clientSlug } = req.params
        const { firstName, lastName, email } = req.body

        const clientId = await clients.getIdBySlug(clientSlug)

        const { data: existingUser, error: selectError } = await db
            .from(Tables.NEWSLETTER)
            .select('*')
            .eq('email', email)
            .eq('client_id', clientId) // Optional if emails need to be unique per client
            .single()

        if (selectError && selectError.code !== 'PGRST116') {
            // 'PGRST116' is "No rows found"
            throw selectError
        }
        if (existingUser) {
            throw {
                status: 409,
                message: 'Subscriber already exists'
            }
            // res.status(409).json({ message: 'Subscriber already exists' })
        }

        const { error, data } = await db
            .from(Tables.NEWSLETTER)
            .insert([
                {
                    client_id: clientId,
                    firstname: firstName,
                    lastname: lastName,
                    email,
                    updated_at: new Date()
                }
            ])
            .select()
        if (error) throw error
        return res.status(201).json(data)
    } catch (err) {
        return handleGenericError(err, res)
    }
}

export default { add, getAll }
