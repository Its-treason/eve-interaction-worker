import {Event} from '../Value/Event';
import {Id} from '../Value/Id';
import {EventTopic} from '../types';
import {EventStore} from './EventStore';

export class Aggregate {
  private events: Event[] = [];
  private version = 0;

  private constructor(events: Event[]) {
    events.forEach(event => {
      this.apply(event);
    });
  }

  public static reconstitute(events: Event[]): Aggregate {
    return new Aggregate(events);
  }

  public static createNew(): Aggregate {
    return new Aggregate([]);
  }

  public async record(topic: EventTopic, payload: { [key: string]: string }): Promise<Event> {
    const newEventId = Id.generate();

    const event = Event.fromValues(
      newEventId,
      this.events[this.events.length - 1]?.getEventId() || newEventId,
      this.events[0]?.getEventId() || newEventId,
      topic,
      null,
      payload,
    );

    this.apply(event);

    await EventStore.saveAggregate(this);

    return event;
  }

  getEventByTopic(topic: EventTopic): Event {
    for (const event of this.events) {
      if (event.getTopic() === topic) {
        return event;
      }
    }

    return null;
  }

  private apply(event: Event): void {
    this.events.push(event);
    this.version++;
  }

  public popEvents(): Event[] {
    return this.events;
  }
}
