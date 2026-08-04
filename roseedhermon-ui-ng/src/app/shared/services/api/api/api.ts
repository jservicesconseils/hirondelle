export * from './eventController.service';
import { EventControllerService } from './eventController.service';
export * from './eventFeedbackController.service';
import { EventFeedbackControllerService } from './eventFeedbackController.service';
export * from './eventRegistrationController.service';
import { EventRegistrationControllerService } from './eventRegistrationController.service';
export const APIS = [EventControllerService, EventFeedbackControllerService, EventRegistrationControllerService];
