import { relations } from "drizzle-orm/relations";
import { events, attendance } from "./schema";

export const attendanceRelations = relations(attendance, ({one}) => ({
	event: one(events, {
		fields: [attendance.eventId],
		references: [events.id]
	}),
}));

export const eventsRelations = relations(events, ({many}) => ({
	attendances: many(attendance),
}));