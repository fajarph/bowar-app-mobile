import type { HttpContext } from '@adonisjs/core/http'
import ChatMessage from '#models/chat_message'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

export default class ChatController {
    /**
     * Get messages for a specific conversation
     * GET /chat/:warnetId
     * GET /operator/chat/:userId
     */
    async index({ auth, params, request, response }: HttpContext) {
        try {
            const authUser = auth.user as User
            const warnetId = params.warnetId // Format varies based on user/operator route
            const userId = params.userId // Only for operator route

            let query = ChatMessage.query()

            // If user is accessing their chat with a warnet
            if (!userId && warnetId) {
                query.where('user_id', authUser.id)
                    .where('warnet_id', warnetId)
            }
            // If operator is accessing a user's chat
            else if (userId && authUser.warnet_id) {
                query.where('user_id', userId)
                    .where('warnet_id', authUser.warnet_id)
            } else {
                return response.badRequest({ message: 'Invalid conversation parameters' })
            }

            const messages = await query.orderBy('created_at', 'asc')

            return response.ok({
                message: 'Messages retrieved',
                data: messages.map(m => m.serialize())
            })
        } catch (error) {
            console.error('Chat index error:', error)
            return response.internalServerError({ message: 'Failed to load messages' })
        }
    }

    /**
     * Send a message
     * POST /chat
     */
    async store({ auth, request, response }: HttpContext) {
        try {
            const authUser = auth.user as User
            const { message, warnet_id, user_id } = request.only(['message', 'warnet_id', 'user_id'])

            if (!message || !message.trim()) {
                return response.badRequest({ message: 'Message cannot be empty' })
            }

            const chat = new ChatMessage()
            chat.message = message.trim()

            // If regular user sending to warnet
            if (authUser.role !== 'operator') {
                chat.user_id = authUser.id
                chat.warnet_id = warnet_id
                chat.sender_id = authUser.id
                chat.sender_type = 'user'
            }
            // If operator sending to user
            else {
                if (!authUser.warnet_id) {
                    return response.forbidden({ message: 'Operator not assigned to a warnet' })
                }
                chat.user_id = user_id
                chat.warnet_id = authUser.warnet_id
                chat.sender_id = authUser.id
                chat.sender_type = 'operator'
            }

            await chat.save()

            return response.created({
                message: 'Message sent',
                data: chat.serialize()
            })
        } catch (error) {
            console.error('Chat store error:', error)
            return response.internalServerError({ message: 'Failed to send message' })
        }
    }

    /**
     * Get all user conversations for the operator's warnet
     * GET /operator/conversations
     */
    async getConversations({ auth, response }: HttpContext) {
        try {
            const operator = auth.user as User

            if (operator.role !== 'operator' || !operator.warnet_id) {
                return response.forbidden({ message: 'Unauthorized' })
            }

            const currentWarnetId = operator.warnet_id

            // Group by user_id to get unique conversations for this warnet
            // Join with users to get username/avatar
            const conversations = await db.from('chat_messages')
                .select('user_id')
                .max('created_at as last_message_at')
                .where('warnet_id', currentWarnetId)
                .groupBy('user_id')
                .orderBy('last_message_at', 'desc')

            // Load user details for each conversation and last message
            const results = await Promise.all(conversations.map(async (conv) => {
                const user = await User.find(conv.user_id)
                const lastMsg = await ChatMessage.query()
                    .where('user_id', conv.user_id)
                    .where('warnet_id', currentWarnetId)
                    .orderBy('created_at', 'desc')
                    .first()

                const unreadResults = await ChatMessage.query()
                    .where('user_id', conv.user_id)
                    .where('warnet_id', currentWarnetId)
                    .where('sender_type', 'user')
                    .where('is_read', false)
                    .count('* as total')

                const total = unreadResults[0].$extras.total

                return {
                    user: user ? { id: user.id, username: user.username, email: user.email, avatar: user.avatar } : null,
                    lastMessage: lastMsg ? lastMsg.serialize() : null,
                    unreadCount: parseInt(total || '0')
                }
            }))

            return response.ok({
                message: 'Conversations retrieved',
                data: results
            })
        } catch (error) {
            console.error('Get conversations error:', error)
            return response.internalServerError({ message: 'Failed to load conversations' })
        }
    }

    /**
     * Mark messages as read
     * PATCH /chat/read/:id
     */
    async markRead({ auth, params, response }: HttpContext) {
        try {
            const authUser = auth.user as User
            const chatId = params.id

            const message = await ChatMessage.find(chatId)
            if (!message) return response.notFound({ message: 'Message not found' })

            // Logic to ensure only the recipient can mark as read
            // (User marks operator messages, Operator marks user messages)
            if (message.sender_type === 'operator' && message.user_id === authUser.id) {
                await message.markAsRead()
            } else if (message.sender_type === 'user' && authUser.warnet_id === message.warnet_id) {
                await message.markAsRead()
            }

            return response.ok({ message: 'Marked as read' })
        } catch (error) {
            return response.internalServerError({ message: 'Update failed' })
        }
    }
}
