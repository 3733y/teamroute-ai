export interface Location {
  name: string;
  x: number; // coordinate in meters
}

export const CAMPUS_LOCATIONS = [
  { name: 'K Hall', x: 0, y: 0 },
  { name: 'J Hall', x: 180, y: 120 },
  { name: 'X Hall', x: -150, y: 80 },
  { name: 'GA Hall', x: 220, y: -180 },
  { name: 'DASAN Hall', x: -250, y: -120 },
  { name: 'Sinchon Station', x: 1000, y: 700 }
];

export type TransportationMethod = 'Walking' | 'Biking' | 'Transit' | 'Driving';

export interface ScheduleEvent {
  id: string;
  memberName: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string; // Name of location or custom
  bufferTime: number; // in minutes
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  isOnline: boolean;
  location?: string;
}

export interface MemberStatusDetail {
  status: 'Available' | 'Busy' | 'Tight transition';
  travelTime: number;
  bufferTime: number;
  overlapMins: number;
}

export interface RecommendationSlot {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  score: number; // 0 - 100
  meetingLocation: string;
  locationMode: 'Fixed' | 'Suggested';
  isOnline: boolean;
  explanations: string[];
  memberStatuses: Record<string, MemberStatusDetail>;
}

// Get coordinate for location name
export function getLocationCoords(locationName: string): { x: number; y: number } {
  const loc = CAMPUS_LOCATIONS.find((l) => l.name === locationName);
  if (loc) return { x: loc.x, y: loc.y };
  // Default coordinate for unknown/custom locations
  return { x: 500, y: 500 };
}

// Calculate travel time in minutes between two locations
export function calculateTravelTime(
  fromLoc: string,
  toLoc: string,
  method: TransportationMethod
): number {
  if (fromLoc === toLoc) return 0;
  
  const p1 = getLocationCoords(fromLoc);
  const p2 = getLocationCoords(toLoc);
  
  // Euclidean distance
  const distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  
  let speed = 80; // walking speed: 80m/min (4.8km/h)
  let overhead = 0; // base overhead (parking, waiting, etc.)
  
  switch (method) {
    case 'Biking':
      speed = 250; // 15km/h
      overhead = 2; // lock bike
      break;
    case 'Transit':
      speed = 400; // 24km/h
      overhead = 6; // wait for bus
      break;
    case 'Driving':
      speed = 600; // 36km/h
      overhead = 4; // parking
      break;
    case 'Walking':
    default:
      speed = 80;
      overhead = 0;
      break;
  }
  
  const travelTimeMins = Math.round(distance / speed + overhead);
  return travelTimeMins;
}

// Helper: parse HH:MM to minutes since midnight
export function timeToMins(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper: format minutes since midnight to HH:MM
export function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Evaluate availability for a single candidate slot and location
function evaluateSlot(
  members: string[],
  schedules: Record<string, ScheduleEvent[]>,
  date: string,
  startMins: number,
  endMins: number,
  isOnline: boolean,
  meetingLocation: string,
  transportMethod: TransportationMethod
) {
  let hasHardConflict = false;
  let hasTightTransition = false;
  let deductions = 0;
  const explanations: string[] = [];
  const memberStatuses: Record<string, MemberStatusDetail> = {};
  let totalTravelBurden = 0;

  for (const member of members) {
    const memberEvents = (schedules[member] || []).filter((e) => e.date === date);
    let currentStatus: MemberStatusDetail = {
      status: 'Available',
      travelTime: 0,
      bufferTime: 0,
      overlapMins: 0,
    };

    for (const event of memberEvents) {
      const eventStart = timeToMins(event.startTime);
      const eventEnd = timeToMins(event.endTime);

      // Direct conflict check
      if (startMins < eventEnd && endMins > eventStart) {
        const overlap = Math.min(endMins, eventEnd) - Math.max(startMins, eventStart);
        currentStatus = {
          status: 'Busy',
          travelTime: 0,
          bufferTime: 0,
          overlapMins: overlap,
        };
        hasHardConflict = true;
        explanations.push(
          `${member} is Busy: "${event.title}" (${event.startTime} - ${event.endTime}) [Overlap: ${overlap} mins].`
        );
        break;
      }

      // Transition conflict checks
      if (!isOnline) {
        // Event ends before meeting starts
        if (eventEnd <= startMins) {
          const travel = calculateTravelTime(event.location, meetingLocation, transportMethod);
          const buffer = event.bufferTime;
          const unavailableUntil = eventEnd + travel + buffer;
          
          if (startMins < unavailableUntil) {
            const overlap = unavailableUntil - startMins;
            currentStatus = {
              status: 'Tight transition',
              travelTime: travel,
              bufferTime: buffer,
              overlapMins: overlap,
            };
            totalTravelBurden += travel;
            hasTightTransition = true;
            deductions += Math.min(25, Math.round(overlap * 1.5));
            explanations.push(
              `${member} has a Tight transition: needs ${travel}m travel & ${buffer}m buffer after "${event.title}" (ends ${event.endTime}).`
            );
          } else {
            // Member can make it, but document their travel stats
            currentStatus.travelTime = Math.max(currentStatus.travelTime, travel);
            currentStatus.bufferTime = Math.max(currentStatus.bufferTime, buffer);
            totalTravelBurden += travel;
          }
        }

        // Event starts after meeting ends
        if (eventStart >= endMins) {
          const travel = calculateTravelTime(meetingLocation, event.location, transportMethod);
          const buffer = event.bufferTime;
          const leaveBy = eventStart - travel - buffer;

          if (endMins > leaveBy) {
            const overlap = endMins - leaveBy;
            currentStatus = {
              status: 'Tight transition',
              travelTime: travel,
              bufferTime: buffer,
              overlapMins: overlap,
            };
            totalTravelBurden += travel;
            hasTightTransition = true;
            deductions += Math.min(25, Math.round(overlap * 1.5));
            explanations.push(
              `${member} has a Tight transition: needs ${travel}m travel & ${buffer}m buffer before "${event.title}" (starts ${event.startTime}).`
            );
          } else {
            currentStatus.travelTime = Math.max(currentStatus.travelTime, travel);
            currentStatus.bufferTime = Math.max(currentStatus.bufferTime, buffer);
            totalTravelBurden += travel;
          }
        }
      } else {
        // Online: travel is 0, but buffer is still respected
        if (eventEnd <= startMins) {
          const buffer = event.bufferTime;
          const unavailableUntil = eventEnd + buffer;
          if (startMins < unavailableUntil) {
            const overlap = unavailableUntil - startMins;
            currentStatus = {
              status: 'Tight transition',
              travelTime: 0,
              bufferTime: buffer,
              overlapMins: overlap,
            };
            hasTightTransition = true;
            deductions += Math.min(20, Math.round(overlap * 1.2));
            explanations.push(
              `${member} has a Tight transition: needs ${buffer}m buffer after "${event.title}" (ends ${event.endTime}).`
            );
          } else {
            currentStatus.bufferTime = Math.max(currentStatus.bufferTime, buffer);
          }
        }

        if (eventStart >= endMins) {
          const buffer = event.bufferTime;
          const leaveBy = eventStart - buffer;
          if (endMins > leaveBy) {
            const overlap = endMins - leaveBy;
            currentStatus = {
              status: 'Tight transition',
              travelTime: 0,
              bufferTime: buffer,
              overlapMins: overlap,
            };
            hasTightTransition = true;
            deductions += Math.min(20, Math.round(overlap * 1.2));
            explanations.push(
              `${member} has a Tight transition: needs ${buffer}m buffer before "${event.title}" (starts ${event.startTime}).`
            );
          } else {
            currentStatus.bufferTime = Math.max(currentStatus.bufferTime, buffer);
          }
        }
      }
    }

    memberStatuses[member] = currentStatus;
  }

  let finalScore = 100;
  if (hasHardConflict) {
    finalScore = 0;
  } else if (hasTightTransition) {
    finalScore = Math.max(30, Math.min(70, 100 - deductions));
  } else {
    finalScore = 100;
  }

  return {
    score: finalScore,
    explanations,
    memberStatuses,
    totalTravelBurden,
  };
}

// Generate schedule recommendations for a team on a specific date
export function generateRecommendations(
  members: string[],
  schedules: Record<string, ScheduleEvent[]>, // key: memberName
  date: string,
  durationMins: number,
  isOnline: boolean,
  locationMode: 'Fixed' | 'Suggested',
  selectedLocation: string,
  transportMethod: TransportationMethod
): RecommendationSlot[] {
  const slots: RecommendationSlot[] = [];
  
  const dayStart = timeToMins('09:00');
  const dayEnd = timeToMins('21:00');
  
  for (let start = dayStart; start <= dayEnd - durationMins; start += 30) {
    const end = start + durationMins;
    const startTimeStr = minsToTime(start);
    const endTimeStr = minsToTime(end);

    if (isOnline) {
      // Online mode: single evaluation at location "Online"
      const evalResult = evaluateSlot(members, schedules, date, start, end, true, 'Online', transportMethod);
      
      const finalExplanations = [...evalResult.explanations];
      if (evalResult.score === 0) {
        finalExplanations.unshift('Conflict detected! One or more members have overlapping commitments.');
      } else if (evalResult.score >= 90) {
        finalExplanations.unshift('Perfect fit! Online meeting, travel times are fully ignored.');
      } else if (evalResult.score >= 70) {
        finalExplanations.unshift('Good option for an online sync, with minor buffer overlaps.');
      } else {
        finalExplanations.unshift('Several members have schedule conflicts or back-to-back classes.');
      }

      slots.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        score: evalResult.score,
        meetingLocation: 'Online',
        locationMode: 'Fixed',
        isOnline: true,
        explanations: finalExplanations,
        memberStatuses: evalResult.memberStatuses,
      });
    } else {
      // Offline mode
      if (locationMode === 'Fixed') {
        const evalResult = evaluateSlot(members, schedules, date, start, end, false, selectedLocation, transportMethod);
        
        const finalExplanations = [...evalResult.explanations];
        if (evalResult.score === 0) {
          finalExplanations.unshift('Conflict detected! One or more members have overlapping commitments.');
        } else if (evalResult.score >= 90) {
          finalExplanations.unshift(`Highly recommended! All members can easily travel to ${selectedLocation}.`);
        } else if (evalResult.score >= 70) {
          finalExplanations.unshift(`Good slot at ${selectedLocation}, with minor transition friction.`);
        } else {
          finalExplanations.unshift(`High commute friction or direct conflicts at ${selectedLocation}.`);
        }

        slots.push({
          startTime: startTimeStr,
          endTime: endTimeStr,
          score: evalResult.score,
          meetingLocation: selectedLocation,
          locationMode: 'Fixed',
          isOnline: false,
          explanations: finalExplanations,
          memberStatuses: evalResult.memberStatuses,
        });
      } else {
        // Suggested Location mode: evaluate ALL locations and suggest the best one
        let bestLocation = CAMPUS_LOCATIONS[0].name;
        let bestScore = -1;
        let bestBurden = Infinity;
        let bestEval: ReturnType<typeof evaluateSlot> | null = null;

        for (const loc of CAMPUS_LOCATIONS) {
          const evalResult = evaluateSlot(members, schedules, date, start, end, false, loc.name, transportMethod);
          // Prefer higher score. Tie-break with lower travel burden
          if (
            evalResult.score > bestScore || 
            (evalResult.score === bestScore && evalResult.totalTravelBurden < bestBurden)
          ) {
            bestScore = evalResult.score;
            bestBurden = evalResult.totalTravelBurden;
            bestLocation = loc.name;
            bestEval = evalResult;
          }
        }

        if (bestEval) {
          const finalExplanations = [...bestEval.explanations];
          if (bestEval.score === 0) {
            finalExplanations.unshift('Conflict detected! One or more members have overlapping commitments.');
          } else {
            finalExplanations.unshift(
              `Suggested location: ${bestLocation} (minimized total travel burden to ${bestBurden} mins).`
            );
            if (bestEval.score >= 90) {
              finalExplanations.unshift('Highly recommended! Optimal location and time slot.');
            } else if (bestEval.score >= 70) {
              finalExplanations.unshift(`Good slot if held at ${bestLocation}.`);
            } else {
              finalExplanations.unshift(`All locations present conflicts; ${bestLocation} is the least disruptive.`);
            }
          }

          slots.push({
            startTime: startTimeStr,
            endTime: endTimeStr,
            score: bestEval.score,
            meetingLocation: bestLocation,
            locationMode: 'Suggested',
            isOnline: false,
            explanations: finalExplanations,
            memberStatuses: bestEval.memberStatuses,
          });
        }
      }
    }
  }
  
  // Sort slots by score descending, then by time ascending
  return slots.sort((a, b) => b.score - a.score || timeToMins(a.startTime) - timeToMins(b.startTime));
}
