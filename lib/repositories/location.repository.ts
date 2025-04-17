export async function getLocations() {
  try {
    const response = await fetch('/api/location');
    return await response.json();
  } catch (error) {
    console.error('Error in getLocations:', error);
    throw error;
  }
}

export async function getLocationById(id: string) {
  try {
    const response = await fetch(`/api/location?id=${id}`);
    return await response.json();
  } catch (error) {
    console.error('Error in getLocationById:', error);
    throw error;
  }
}

export async function getLocationsByType(type: "kebele" | "district" | "zone" | "region") {
  try {
    const response = await fetch(`/api/location?type=${type}`);
    return await response.json();
  } catch (error) {
    console.error('Error in getLocationsByType:', error);
    throw error;
  }
}

export async function getLocationsByCampaign(campaignId: string) {
  try {
    const response = await fetch(`/api/location?campaignId=${campaignId}`);
    return await response.json();
  } catch (error) {
    console.error('Error in getLocationsByCampaign:', error);
    throw error;
  }
}

export async function createLocation(location: any) {
  try {
    const response = await fetch('/api/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(location),
    });
    return await response.json();
  } catch (error) {
    console.error('Error in createLocation:', error);
    throw error;
  }
}

export async function updateLocation(id: string, location: any) {
  try {
    const response = await fetch(`/api/location?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(location),
    });
    return await response.json();
  } catch (error) {
    console.error('Error in updateLocation:', error);
    throw error;
  }
}

export async function deleteLocation(id: string) {
  try {
    const response = await fetch(`/api/location?id=${id}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    console.error('Error in deleteLocation:', error);
    throw error;
  }
}

export async function addLocationToCampaign(campaignId: string, locationId: string) {
  try {
    const response = await fetch(`/api/location?campaignId=${campaignId}&locationId=${locationId}`, {
      method: 'PATCH',
    });
    return await response.json();
  } catch (error) {
    console.error('Error in addLocationToCampaign:', error);
    throw error;
  }
}

export async function getLocationCount() {
  try {
    const response = await fetch('/api/location?count=true');
    return await response.json();
  } catch (error) {
    console.error('Error in getLocationCount:', error);
    throw error;
  }
}